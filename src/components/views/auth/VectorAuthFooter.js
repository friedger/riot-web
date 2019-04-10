/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2019 New Vector Ltd

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

'use strict';

const React = require('react');
import { _t } from 'matrix-react-sdk/lib/languageHandler';

module.exports = React.createClass({
    displayName: 'VectorAuthFooter',
    statics: {
        replaces: 'AuthFooter',
    },

    render: function() {
        return (
            <div className="mx_AuthFooter">
                <a href="https://openintents.org/blog" target="_blank" rel="noopener">blog</a>
                <a href="https://twitter.com/@openintents" target="_blank" rel="noopener">twitter</a>
                <a href="https://github.com/friedger/riot-web" target="_blank" rel="noopener">github</a>
                <a href="https://matrix.org" target="_blank" rel="noopener">{ _t('powered by Matrix') }</a>
            </div>
        );
    },
});
