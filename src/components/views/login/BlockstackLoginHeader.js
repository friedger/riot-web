/*
Copyright 2015, 2016 OpenMarket Ltd

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

"use strict";

import React from "react";
import PropTypes from "prop-types";

const DEFAULT_LOGO_URI = "themes/riot/img/logos/oichat.svg";

module.exports = React.createClass({
    displayName: "BlockstackLoginHeader",
    statics: {
        replaces: "LoginHeader"
    },
    propTypes: {
        icon: PropTypes.string
    },

    render: function() {
        return (
            <div className="mx_Login_header">
                <h1>OI Chat</h1>
                <div className="mx_Login_logo">
                    <img
                        src={this.props.icon || DEFAULT_LOGO_URI}
                        alt="OI Chat"
                    />
                </div>
                <div>
                    <h2>
                        Your gateway to an open network for secure,
                        decentralized communication.
                    </h2>
                    <p>
                        OI Chat is a matrix service dedicated to users with
                        Blockstack IDs.                    
                        Your Blockstack ID is your account. 
                        The first 1000 are given away for free!
                    </p>
                    <div className="mx_Login_learn">
                        <div>
                            <a href="https://matrix.org">
                                <img src="home/images/matrix.svg" />
                                <br />
                                Learn more about matrix.org
                            </a>
                        </div>
                        <div>
                            <a href="https://blockstack.org">
                                <img src="home/images/blockstack.png" />
                                <br />
                                Learn more about blockstack.org
                            </a>
                        </div>
                    </div>
                    <div className="mx_Login_error">
                        We are updating our authentication servers. Login will fail for now!!!
                        You can contact us on <a href="mailto:support@openintents.org">support at openintents.org</a>
                    </div>
                </div>
            </div>
        );
    }
});
