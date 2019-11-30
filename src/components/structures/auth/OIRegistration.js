import React from "react";
import createReactClass from 'create-react-class';
import sdk from "matrix-react-sdk";
import { _t } from "matrix-react-sdk/lib/languageHandler";

module.exports = createReactClass({
    displayName: "OIRegistration",
    statics: {
        replaces: "Registration",
    },

    render: function() {
        const signIn = (
            <a
                className="mx_AuthBody_changeFlow"
                onClick={this.props.onLoginClick}
                href="#"
            >
                <button
                    className="mx_Login_submit"
                    style={{
                        backgroundImage: `url("welcome/images/icon-sign-in.svg")`,
                        backgroundRepeat: `no-repeat`,
                        backgroundPosition: `10px center`,
                        margin: "10px"
                    }}
                >
                    {_t("Sign in instead")}
                </button>
            </a>
        );

        const createNewIdentity = (
            <a
                className="mx_AuthBody_changeFlow"
                href="https://browser.blockstack.org"
                target="_blank"
                rel="noopener"
            >
                <button
                    className="mx_Login_submit"
                    style={{
                        backgroundImage: `url("welcome/images/icon-blockstack.svg")`,
                        backgroundRepeat: `no-repeat`,
                        backgroundPosition: `10px center`,
                        margin: "10px"
                    }}
                >
                    Create a new identity with Blockstack
                </button>
            </a>
        );

        const AuthHeader = sdk.getComponent("auth.AuthHeader");
        const AuthBody = sdk.getComponent("auth.AuthBody");
        const AuthPage = sdk.getComponent("auth.AuthPage");

        return (
            <AuthPage>
                <AuthHeader />
                <AuthBody>
                    <div>
                        <h2>{_t("Create your account")}</h2>

                        <h3>
                            There is no need to create an account because you
                            own already your identity!
                        </h3>
                        <h4>
                            Most social media companies are providing you with a
                            free account so that they can sell your information
                            to the highest bidder. Blockstack is different. With
                            Blockstack, YOU control your identity. Neither
                            Blockstack nor the makers of Blockstack apps can
                            take the id from you or have access to it.
                        </h4>
                    </div>
                    {signIn}
                    {createNewIdentity}
                </AuthBody>
            </AuthPage>
        );
    }
});
