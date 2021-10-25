define(['postmonger'], function(Postmonger) {
    'use strict';

    /* DEPENDENCIES AND DECLARATION */
    let connection = new Postmonger.Session();
    let steps = [{
            label: 'Select Fields',
            key: 'step1',
            active: true
        },
        {
            label: 'Preview & Confirm',
            key: 'step2',
            active: false
        },
    ];
    let currentStep = steps[0].key;
    let eventDefinitionKey;
    let messageObject = {};
    let payload = {};
    let messageContent = '';
    let messageChannel = '';
    let senderName = '';
    let messageTemplate = '';
    let characteristic = {};
    let searchIndexes = {};


    /* INITIALIZATION */
    $(window).ready(onRender);

    // Postmonger events from SFMC
    connection.on('initActivity', init);
    connection.on('clickedNext', onClickedNext);
    connection.on('clickedBack', onClickedBack);
    connection.on('gotoStep', onGotoStep);
    connection.on('requestedTriggerEventDefinition', onRequestedTriggerEventDefinition);

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('updateButton', {
            button: 'next',
            enabled: false
        });
        connection.trigger('requestTriggerEventDefinition');
        $('#spinner').hide();
    }

    //retrieves the existing configuration of the CA on initialization
    //retrieves the existing configuration of the CA on initialization
    function init(data) {
        payload = data;

        let hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        if (hasInArguments) {
            let args = data['arguments'].execute.inArguments[0];
            messageContent = args.messageContent;
            messageChannel = args.messageChannel;
            senderName = args.senderName;
            messageTemplate = args.messageTemplate;
            characteristic = args.characteristic;
            searchIndexes = args.searchIndexes;

            $('#messageContent').val(messageContent);
            $('#messageChannel').val(messageChannel);
            $('#senderName').val(senderName);
            $('#messageTemplate').val(messageTemplate);
            $('#characteristic').val(characteristic);
            $('#searchIndexes').val(searchIndexes);

            messageChannel == 'SMART_SMS' ?
            $('#smart_template_fields').show() :
            $('#smart_template_fields').hide();
             
            updateNextButton(isStepOneValid());
        }
    }

    //retrieves the dataExtensionKey and eventDefinitionKey on initialization 
    function onRequestedTriggerEventDefinition(eventDefinitionModel) {
        if (eventDefinitionModel) {
            if (eventDefinitionModel.dataExtensionId) {
                eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
            } else {
                $('#notify').show();
                $('#notify').text(
                    'There is no entry source configured for this journey, please select an entry data extension'
                );
            }
        }
    };

    /**CONTROLS RELATED**/

    //calls the functions that are needed for the next step of the custom activity
    function onClickedNext() {
        $('#notify').hide();

        if (currentStep.key === 'step1') {
            setReviewPageVariables();
            connection.trigger('nextStep');
        } else if (currentStep.key === 'step2') {
            updateNextButton(false);
            onActivityComplete();
        } else {
            connection.trigger('nextStep');
        }
    }

    function onClickedBack() {
        connection.trigger('prevStep');
    }

    function onGotoStep(step) {
        showStep(step);
        connection.trigger('ready');
    }

    function showStep(step, stepIndex) {
        if (stepIndex && !step) {
            step = steps[stepIndex - 1];
        }

        currentStep = step;

        $('.step').hide();
        $('#' + currentStep.key).show();
    }

    function updateNextButton(enabled) {
        connection.trigger('updateButton', {
            button: 'next',
            enabled: enabled
        });
    }

    function isValidValue(value) {
        return $.trim(value).length > 0;
    }

    /**STEP 1 RELATED FUNCTIONS**/

    function isStepOneValid() {
        return (
            isValidValue(messageContent) && isValidValue(messageChannel) && isValidValue(senderName)
        );
    }

    function getChannelValue() {
        return $('#messageChannel option:selected')
            .val()
            .trim();
    }

    function getContentValue() {
        return $('#messageContent')
            .val()
            .trim();
    }

    function getSenderNameValue() {
        return $('#senderName')
            .val()
            .trim();
    }

    function getTemplateValue() {
        return $('#messageTemplate')
            .val()
            .trim();
    }

    function getCharacteristicValue() {
        return $('#characteristic')
            .val()
            .trim();
    }

    function getSearchIndexesValue() {
        return $('#searchIndexes')
            .val()
            .trim();
    }

    $('#messageChannel').change(function() {
        messageChannel = getChannelValue();
        messageChannel == 'SMART_SMS' ?
            $('#smart_template_fields').show() :
            $('#smart_template_fields').hide();
        updateNextButton(isStepOneValid());
    });

    $('#messageContent').keyup(function() {
        messageContent = getContentValue();
        updateNextButton(isStepOneValid());
    });

    $('#senderName').keyup(function() {
        senderName = getSenderNameValue();
        updateNextButton(isStepOneValid());
    });

    $('#messageTemplate').keyup(function() {
        messageTemplate = getTemplateValue();
        updateNextButton(isStepOneValid());
    });

    $('#characteristic').keyup(function() {
        characteristic = getCharacteristicValue();
        updateNextButton(isStepOneValid());
    });

    $('#searchIndexes').keyup(function() {
        searchIndexes = getSearchIndexesValue();
        updateNextButton(isStepOneValid());
    });

    /**STEP 2 RELATED FUNCTIONS**/
    function setReviewPageVariables() {
        messageObject['id'] = `{{Event.${eventDefinitionKey}.id}}`;
        messageObject['mobileNumber'] = `{{Event.${eventDefinitionKey}.mobileNumber}}`;
        messageObject['mobileCountryCode'] = `{{Event.${eventDefinitionKey}.mobileCountryCode}}`;
        messageObject['ContactKey'] = '{{Contact.Key}}';

        messageObject['messageContent'] = messageContent;
        messageObject['messageChannel'] = messageChannel;
        messageObject['senderName'] = senderName;

        if (messageChannel == 'SMART_SMS') {
            messageObject['messageTemplate'] = messageTemplate;
            messageObject['characteristic'] = characteristic;
            messageObject['searchIndexes'] = searchIndexes;
        }
        $('#review_message').text(JSON.stringify(messageObject, undefined, 2));
    }


    //saves the Custom Activity inarguments which will be referenced during journey run-time
    function onActivityComplete() {
        payload['arguments'].execute.inArguments.length = 0;
        payload['arguments'].execute.inArguments.push(messageObject);

        payload['metaData'].isConfigured = true;

        connection.trigger('updateActivity', payload);
        updateNextButton(true);
    }
});