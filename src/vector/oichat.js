import React, { Component } from "react";
import { UserSession } from "blockstack";
import { getPublicKeyFromPrivate } from "blockstack/lib/keys";
import ScatterJS from "scatterjs-core";
import ScatterEOS from "scatterjs-plugin-eosjs";

const userSession = new UserSession();

export const checkPendingSignIn = () => {
    if (userSession.isSignInPending()) {
        console.log("blockstack signIn is pending");

        const href =
            window.location.origin +
            window.location.pathname +
            window.location.hash;
        console.log({ href });

        if (userSession.isUserSignedIn()) {
            console.log("blockstack user already signed in");
            return;
        } else {
            userSession.handlePendingSignIn().then(u => {
                window.location.href =
                    window.location.origin +
                    window.location.pathname +
                    "#/login";
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
            return { blockstack: { userData, address }, txid, challenge };
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
                challenge
            };
        });
}


export function submitUserResponse(
    challenge,
    username,
    address,
    txid,
    onSubmit
) {
    userSession
        .putFile("mxid.json", challenge, { encrypt: false, sign: true })
        .then(() => {
            onSubmit(
                address,
                "",
                "",
                txid + "|" + window.origin + "|" + username
            );
        });
}

export function onBlockstackLoginClick(ev) {
    ev.preventDefault();
    userSession.redirectToSignIn(
        window.location.origin + "/",
        window.location.origin + "/manifest.json",
        ["store_write", "publish_data"]
    );
}

export function onBlockstackSignoutClick(ev, setState) {
    userSession.signUserOut();
    setState({ userData: undefined, address: undefined });
}

export function onScatterLoginClick(ev) {}

export function submitScatterResponse(
    accountName,
    message,
    signature,
    txid,
    onSubmit
) {
    const password = txid + "|" + message + "|" + signature;
    console.log("u/p", { accountName, password }, password.length);
    onSubmit(accountName, "", "", password);
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

        this.onSubmitForm = this.onSubmitForm.bind(this);

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
                submitUserResponse(
                    state.challenge,
                    state.blockstack.userData.username,
                    state.blockstack.address,
                    state.txid,
                    this.props.onSubmit
                );
            });
        } else if (userSession.isSignInPending()) {
            console.log("signIn is pending");
            userSession.handlePendingSignIn().then(userData => {
                blockstackStateFromUserData(userData).then(state => {
                    this.setState(state);
                    submitUserResponse(
                        state.challenge,
                        state.blockstack.userData.username,
                        state.blockstack.address,
                        state.txid,
                        this.props.onSubmit
                    );
                });
            });
        }

    }

    onBlockstackLoginClick(ev) {
        userSession.redirectToSignIn(
            window.location.origin + "/",
            window.location.origin + "/manifest.json",
            ["store_write", "publish_data"]
        );
    }

    onBlockstackSignoutClick(ev) {
        userSession.signUserOut();
        this.setState({ userData: undefined, address: undefined });
    }

    onScatterLoginClick(ev) {
        ScatterJS.plugins(new ScatterEOS());

        const network = ScatterJS.Network.fromJson({
            blockchain: "eos",
            chainId:
                "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
            host: "nodes.get-scatter.com",
            port: 443,
            protocol: "https"
        });
        ScatterJS.connect("Diri Chat", { network }).then(connected => {
            if (!connected) return console.error("no scatter");
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
                                this.scatterStateFromAccount(
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

    render() {
        let username = "";
        if (this.state && this.state.userData) {
            username = this.state.userData.username;
        }
        let address = "";
        if (this.state && this.state.address) {
            address = this.state.address;
        }
        const disableForgetBlockstackId = !this.state.userData;
        return (
            <div>
                <button
                    onClick={this.onScatterLoginClick}
                    disabled={!!this.state.userData}
                >
                    Use your EOS account name
                </button>
                <button
                    onClick={this.onScatterLogouClick}
                    disabled={disableForgetBlockstackId}
                >
                    Forget EOS account name
                </button>
                <button
                    onClick={this.onBlockstackLoginClick}
                    disabled={!!this.state.userData}
                >
                    Use your Blockstack ID
                </button>
                <button
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
                {!username && (
                    <div>
                        <a href="https://docs.blockstack.org">
                            Don't have Blockstack yet? Click here
                        </a>
                    </div>
                )}
                <div>
                    <a
                        target="_blank"
                        href="https://matrix.openintents.org/about"
                    >
                        <button className="mx_Login_blockstack">
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
}
