/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import PropTypes from "prop-types";
import { _t } from "matrix-react-sdk/lib/languageHandler";
import * as blockstack from "blockstack";
import { getPublicKeyFromPrivate } from "blockstack/lib/keys";

/**
 * A pure UI component which displays a login button via a decentralized identifier.
 */
export default class DiriPasswordLogin extends React.Component {
    static replaces = "PasswordLogin";

    static defaultProps = {
        hsDomain: ""
    };

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
        console.log(this.props)
    }

    componentDidMount() {
        console.log("component did mount", blockstack);
        if (blockstack.isUserSignedIn()) {
            console.log("user is signed");
            const userData = blockstack.loadUserData();
            this.blockstackStateFromUserData(userData).then(state => {
                this.setState(state);
                this.submitUserResponse(
                    state.challenge,
                    state.blockstack.userData.username,
                    state.blockstack.address,
                    state.txid
                );
            });
        } else if (blockstack.isSignInPending()) {
            console.log("signIn is pending");
            blockstack.handlePendingSignIn().then(userData => {
                this.blockstackStateFromUserData(userData).then(state => {
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

    blockstackStateFromUserData(userData) {
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

    scatterStateFromAccount(identity) {
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

    onBlockstackLoginClick(ev) {
        blockstack.redirectToSignIn(
            window.location.origin + "/",
            window.location.origin + "/manifest.json",
            ["store_write", "publish_data"]
        );
    }

    onBlockstackSignoutClick(ev) {
        blockstack.signUserOut();
        this.setState({ userData: undefined, address: undefined });
    }

    onScatterLoginClick(ev) {

    }

    submitScatterResponse(accountName, message, signature, txid) {
        const password = txid + "|" + message + "|" + signature;
        console.log("u/p", { accountName, password }, password.length);
        this.props.onSubmit(accountName, "", "", password);
    }

    submitUserResponse(challenge, username, address, txid) {
        blockstack
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

    onSubmitForm(ev) {
        ev.preventDefault();
        this.submitUserResponse(
            this.state.challenge,
            this.state.userData.username,
            this.state.address,
            this.state.txid
        );
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
                <form onSubmit={this.onSubmitForm} />
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

DiriPasswordLogin.propTypes = {
    onSubmit: PropTypes.func.isRequired, // fn(username, password)
    onError: PropTypes.func,
    onForgotPasswordClick: PropTypes.func, // fn()
    initialUsername: PropTypes.string,
    initialPhoneCountry: PropTypes.string,
    initialPhoneNumber: PropTypes.string,
    initialPassword: PropTypes.string,
    onUsernameChanged: PropTypes.func,
    onPhoneCountryChanged: PropTypes.func,
    onPhoneNumberChanged: PropTypes.func,
    onPasswordChanged: PropTypes.func,
    loginIncorrect: PropTypes.bool,
    disableSubmit: PropTypes.bool
};
