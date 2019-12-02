/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*browser:true*/
/*global define*/
define(
    [
        'jquery',
        'Magento_Checkout/js/view/payment/default'
    ],
    function ($, Component) {
        'use strict';

        return Component.extend({
            defaults: {
                template: 'FCamara_Getnet/payment/credit_card/form',
                transactionResult: '',
                creditCardType: '',
                creditCardExpYear: '',
                creditCardExpMonth: '',
                creditCardName: '',
                creditCardNumber: '',
                creditCardNumberToken: '',
                creditCardSsStartMonth: '',
                creditCardSsStartYear: '',
                creditCardSsIssue: '',
                creditCardVerificationNumber: '',
                selectedCardType: null
            },

            initObservable: function () {

                this._super()
                    .observe([
                        'transactionResult',
                        'creditCardType',
                        'creditCardExpYear',
                        'creditCardExpMonth',
                        'creditCardNumber',
                        'creditCardNumberToken',
                        'creditCardName',
                        'creditCardVerificationNumber',
                        'creditCardSsStartMonth',
                        'creditCardSsStartYear',
                        'creditCardSsIssue',
                        'selectedCardType'
                    ]);
                return this;
            },

            getCode: function() {
                return 'getnet_credit_card';
            },

            getData: function() {
                return {
                    'method': this.item.method,
                    'additional_data': {
                        'cc_cid': this.creditCardVerificationNumber(),
                        'cc_type': this.creditCardType(),
                        'cc_exp_year': this.creditCardExpYear(),
                        'cc_exp_month': this.creditCardExpMonth(),
                        'cc_number_token': this.creditCardNumberToken(),
                        'cc_name': this.creditCardName()
                    }
                };
            },

            /**
             * Get payment icons
             * @param {String} type
             * @returns {Boolean}
             */
            getIcons: function (type) {
                return window.checkoutConfig.payment.ccform.icons.hasOwnProperty(type) ?
                    window.checkoutConfig.payment.ccform.icons[type]
                    : false;
            },

            /**
             * Get list of available credit card types
             * @returns {Object}
             */
            getCcAvailableTypes: function () {
                return window.checkoutConfig.payment.getnet_credit_card.availableTypes;
            },

            /**
             * Get list of months
             * @returns {Object}
             */
            getCcMonths: function () {
                return window.checkoutConfig.payment.getnet_credit_card.months;
            },

            /**
             * Get list of years
             * @returns {Object}
             */
            getCcYears: function () {
                return window.checkoutConfig.payment.getnet_credit_card.years;
            },

            /**
             * Get authorization
             * @returns {Object}
             */
            getAuthorizationBasic: function () {
                return window.checkoutConfig.payment.getnet_credit_card.authorizationBasic;
            },

            /**
             * Get authorization
             * @returns {Object}
             */
            getEndpoint: function () {
                return window.checkoutConfig.payment.getnet_credit_card.endpoint;
            },

            /**
             * Get list of available credit card types values
             * @returns {Object}
             */
            getCcAvailableTypesValues: function () {
                return _.map(this.getCcAvailableTypes(), function (value, key) {
                    return {
                        'value': key,
                        'type': value
                    };
                });
            },
            /**
             * Get list of available month values
             * @returns {Object}
             */
            getCcMonthsValues: function () {
                return _.map(this.getCcMonths(), function (value, key) {
                    return {
                        'value': key,
                        'month': value
                    };
                });
            },

            /**
             * Get list of available year values
             * @returns {Object}
             */
            getCcYearsValues: function () {
                return _.map(this.getCcYears(), function (value, key) {
                    return {
                        'value': key,
                        'year': value
                    };
                });
            },

            /**
             * @deprecated
             * @returns {Object}
             */
            getSsStartYearsValues: function () {
                return _.map(this.getSsStartYears(), function (value, key) {
                    return {
                        'value': key,
                        'year': value
                    };
                });
            },

            /**
             * Get available credit card type by code
             * @param {String} code
             * @returns {String}
             */
            getCcTypeTitleByCode: function (code) {
                var title = '',
                    keyValue = 'value',
                    keyType = 'type';

                _.each(this.getCcAvailableTypesValues(), function (value) {
                    if (value[keyValue] === code) {
                        title = value[keyType];
                    }
                });

                return title;
            },

            /**
             * Prepare credit card number to output
             * @param {String} number
             * @returns {String}
             */
            formatDisplayCcNumber: function (number) {
                return 'xxxx-' + number.substr(-4);
            },

            /**
             * Get credit card details
             * @returns {Array}
             */
            getInfo: function () {
                return [
                    {
                        'name': 'Credit Card Type', value: this.getCcTypeTitleByCode(this.creditCardType())
                    },
                    {
                        'name': 'Credit Card Number', value: this.formatDisplayCcNumber(this.creditCardNumber())
                    },
                    {
                        'name': 'Credit Card Name', value: this.creditCardName()
                    }
                ];
            },
            beforePlaceOrder: function () {
                console.log('passei aqui antes de fechar o pedido');

                var endpoint = this.getEndpoint();
                var authorization = this.getAuthorizationBasic();
                var creditCardNumber = this.creditCardNumber();

                $.ajax({
                    showLoader: true,
                    url: endpoint + 'auth/oauth/v2/token',
                    beforeSend: function (request) {
                        request.setRequestHeader("Authorization", authorization);
                        request.setRequestHeader("content-type", 'application/x-www-form-urlencoded');
                        request.setRequestHeader("Accept", 'application/json');
                    },
                    data: 'scope=oob&grant_type=client_credentials',
                    type: "POST",
                    dataType: 'json'
                }).fail(function(data) {
                    console.log(data);
                }).done(function (data) {
                    console.log(data);
                    if(data.access_token) {
                        $.ajax({
                            showLoader: true,
                            url: endpoint + 'v1/tokens/card',
                            beforeSend: function (request) {
                                request.setRequestHeader("Authorization", 'Bearer ' + data.access_token);
                                request.setRequestHeader("Accept", 'application/json');
                            },
                            data: {
                                "card_number": creditCardNumber
                            },
                            type: "POST",
                            dataType: 'json'
                        }).fail(function(data) {
                            console.log(data);
                        }).done(function (data) {
                            this.creditCardNumberToken(data.number_token);
                            this.placeOrder();
                        }.bind(this));
                    }
                }.bind(this));

            }

        });
    }
);