import React, { Component } from "react";
import PropTypes from "prop-types";
import sdk from "matrix-react-sdk";
import { UserSession } from "blockstack";
import { getPublicKeyFromPrivate } from "blockstack/lib/keys";
import ScatterJS from "scatterjs-core";
import ScatterEOS from "scatterjs-plugin-eosjs";

let userSession = new UserSession();

export const checkPendingSignIn = () => {
    if (userSession.isSignInPending()) {
        console.log("blockstack signIn is pending");

        const href =
            window.location.origin + window.location.pathname + "#/login";

        if (userSession.isUserSignedIn()) {
            window.location.href = href;
            console.log("blockstack user already signed in");
            return;
        } else {
            userSession.handlePendingSignIn().then(u => {
                window.location.href = href;
            });
            return;
        }
    }
};

export function blockstackStateFromUserData(userData) {
    console.log(userData);
    console.log("a", userData.identityAddress);
    const txid =
        getPublicKeyFromPrivate(userData.appPrivateKey) + Math.random();
    return fetch("https://auth.openintents.org/c/" + txid, {
        method: "POST"
    })
        .then(response => {
            return response.json();
        })
        .then(challengeObject => {
            const challenge = challengeObject.challenge;
            console.log("challenge", challenge);
            const address = userData.identityAddress.toLowerCase();
            return {
                blockstack: { userData, address },
                txid,
                challenge,
                busy: false
            };
        });
}

export function scatterStateFromAccount(identity) {
    const txid = identity.publicKey + Math.random();
    return fetch("https://auth.openintents.org/c/" + txid, {
        method: "POST"
    })
        .then(response => {
            return response.json();
        })
        .then(challengeObject => {
            const challenge = challengeObject.challenge;
            console.log("challenge", challenge);
            return {
                scatter: { accountName: identity.accounts[0].name },
                txid,
                challenge,
                busy: false
            };
        });
}

export class DIDLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            blockstack: {
                userData: undefined,
                address: undefined
            },
            scatter: {
                identity: undefined
            },
            txid: undefined,
            challenge: undefined
        };

        this.onBlockstackLoginClick = this.onBlockstackLoginClick.bind(this);
        this.onBlockstackSignoutClick = this.onBlockstackSignoutClick.bind(
            this
        );
        this.submitUserResponse = this.submitUserResponse.bind(this);

        this.onScatterLoginClick = this.onScatterLoginClick.bind(this);
        this.submitScatterResponse = this.submitScatterResponse.bind(this);
    }

    componentDidMount() {
        if (userSession.isUserSignedIn()) {
            console.log("user is signed");
            const userData = userSession.loadUserData();
            blockstackStateFromUserData(userData).then(state => {
                this.setState(state);
                this.submitUserResponse(
                    state.challenge,
                    state.blockstack.userData.username,
                    state.blockstack.address,
                    state.txid
                );
            });
        } else if (userSession.isSignInPending()) {
            console.log("signIn is pending");
            userSession.handlePendingSignIn().then(userData => {
                blockstackStateFromUserData(userData).then(state => {
                    this.setState(state);
                    this.submitUserResponse(
                        state.challenge,
                        state.blockstack.userData.username,
                        state.blockstack.address,
                        state.txid
                    );
                });
            });
        }
    }

    onBlockstackLoginClick(ev) {
        this.props.onError(null);
        userSession = new UserSession();
        userSession.redirectToSignIn(
            window.location.origin + "/",
            window.location.origin + "/manifest.json",
            ["store_write", "publish_data"]
        );
    }

    onBlockstackSignoutClick(ev) {
        userSession.signUserOut();
        this.setState({ blockstack: undefined });
    }

    onScatterLoginClick(ev) {
        this.props.onError(null);
        this.setState({ busy: true });
        ScatterJS.plugins(new ScatterEOS());

        const network = ScatterJS.Network.fromJson({
            blockchain: "eos",
            chainId:
                "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
            host: "nodes.get-scatter.com",
            port: 443,
            protocol: "https"
        });
        ScatterJS.connect("OI Chat", { network }).then(connected => {
            if (!connected) {
                console.error("no scatter");
                this.props.onError("Scatter not found");
                this.setState({ busy: false });
                return;
            }
            console.log("connected", { connected });
            fetch("https://nodes.get-scatter.com/v1/chain/get_info")
                .then(response => {
                    return response.json();
                })
                .then(chainInfo => {
                    console.log(chainInfo, { chainInfo });
                    ScatterJS.login().then(id => {
                        if (!id) return console.error("no identity");
                        const account = ScatterJS.account("eos");
                        const publicKey = account.publicKey;
                        const message = `${
                            account.name
                        } would like to login using the ${
                            account.authority
                        } permission. Block ID: ${
                            chainInfo.last_irreversible_block_num
                        } ${chainInfo.last_irreversible_block_id
                            .slice(-12)
                            .toUpperCase()}`;
                        console.log("message", message);
                        ScatterJS.scatter
                            .getArbitrarySignature(publicKey, message)
                            .then(signature => {
                                console.log(signature);
                                scatterStateFromAccount(
                                    ScatterJS.scatter.identity
                                ).then(
                                    state => {
                                        this.setState(state);
                                        console.log(state);
                                        this.submitScatterResponse(
                                            state.scatter.accountName,
                                            message,
                                            signature,
                                            state.txid
                                        );
                                    },
                                    error => {
                                        console.log("error on submit", error);
                                        this.setState({ busy: false });
                                    }
                                );
                            });
                    });
                });
        });
    }

    submitScatterResponse(accountName, message, signature, txid) {
        const password = txid + "|" + message + "|" + signature;
        console.log("u/p", { accountName, password }, password.length);
        this.props.onSubmit(accountName, "", "", password);
    }

    submitUserResponse(challenge, username, address, txid) {
        userSession
            .putFile("mxid.json", challenge, { encrypt: false, sign: true })
            .then(() => {
                this.props.onSubmit(
                    address,
                    "",
                    "",
                    txid + "|" + window.origin + "|" + username
                );
            });
    }

    render() {
        let username = "";
        if (
            this.state &&
            this.state.blockstack &&
            this.state.blockstack.userData
        ) {
            username = this.state.blockstack.userData.username;
        }
        let address = "";
        if (this.state && this.state.blockstack) {
            address = this.state.blockstack.address;
        }
        const disableForgetBlockstackId =
            !this.state.blockstack || !this.state.blockstack.userData;

        const Loader = sdk.getComponent("elements.Spinner");
        const loader = this.state.busy ? (
            <div className="mx_Login_loader">
                <Loader />
            </div>
        ) : null;

        return (
            <div>
                Use the digital identity, that you own
                {loader}
                <button
                    className="mx_Login_submit"
                    style={{
                        backgroundImage: `url("welcome/images/icon-blockstack.svg")`,
                        backgroundRepeat: `no-repeat`,
                        backgroundPosition: `10px center`,
                        margin: "20px 10px 5px 10px"
                    }}
                    onClick={this.onBlockstackLoginClick}
                    disabled={
                        !!this.state.blockstack &&
                        !!this.state.blockstack.userData
                    }
                >
                    Blockstack ID
                </button>
                <button
                    className="mx_Login_submit"
                    style={{
                        margin: "0px 10px"
                    }}
                    onClick={this.onBlockstackSignoutClick}
                    disabled={disableForgetBlockstackId}
                >
                    Forget Blockstack ID
                </button>
                {username && <div>Your Blockstack Id: {username}</div>}
                {!username && address && (
                    <div>
                        Your Blockstack address: {address}. Currently, OI Chat
                        requires a username!
                    </div>
                )}
                <button
                    className="mx_Login_submit"
                    style={{
                        backgroundImage: `url("welcome/images/icon-eos.svg")`,
                        backgroundRepeat: `no-repeat`,
                        backgroundPosition: `10px center`,
                        margin: "20px 10px 5px 10px"
                    }}
                    onClick={this.onScatterLoginClick}
                    disabled={!!this.state.userData}
                >
                    EOS name (with Scatter)
                </button>
                <div>
                    <a
                        target="_blank"
                        href="https://matrix.openintents.org/about"
                    >
                        <button
                            className="mx_Login_submit"
                            style={{
                                backgroundImage: `url("welcome/images/icon-help.svg")`,
                                backgroundRepeat: `no-repeat`,
                                backgroundPosition: `10px center`,
                                backgroundColor: "#999999",
                                margin: "20px 10px"
                            }}
                        >
                            OI Chat is a matrix service ...
                        </button>
                    </a>
                </div>
            </div>
        );
    }
}

DIDLogin.propTypes = {
    onSubmit: PropTypes.func.isRequired, // fn(username, password)
    onError: PropTypes.func.isRequired // fn(error)
};
