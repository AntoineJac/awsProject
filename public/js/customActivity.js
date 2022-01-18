define(['postmonger'], (Postmonger) => {
  /* DEPENDENCIES AND DECLARATION */
  const connection = new Postmonger.Session();
  const steps = [{
    label: 'Select Fields',
    key: 'step1',
    active: true,
  },
  {
    label: 'Preview & Confirm',
    key: 'step2',
    active: false,
  },
  ];
  let currentStep = steps[0].key;
  let eventDefinitionKey;
  let journeyName = '';
  let nodeName = '';
  let messageObject = {};
  let payload = {};
  let messageContent = '';
  let messageChannel = '';
  let senderName = '';
  let category = '';
  let subCategory = '';
  let priority = '';
  let isSensitive = '';
  let isBulked = '';
  let messageTemplate = '';
  let characteristic = [];
  let searchIndexes = [];

  const templateSMS = {
    id: '',
    content: '',
    isSensitive: '',
    description: 'Message Sent by Custom Activity in Journey Builder',
    countryCode: '',
    messageType: '',
    template: '',
    characteristic: [],
    searchIndexes: [],
    priority: '',
    receiver: [
      {
        id: '',
        name: 'ContactKey',
        phoneNumber: '',
        party: {
          id: '',
          role: 'Customer',
          name: 'ContactKey',
          '@referredType': 'Individual',
        },
      },
    ],
    sender: {
      id: 'JourneyBuilderCustomActivity',
      name: 'MarketingCloud',
      phoneNumber: '919743464658',
      party: {
        id: 'JourneyBuilderCustomActivity',
        role: 'SmsApiGateway',
        name: '',
        '@referredType': 'externalSystem',
      },
    },
  };

  const templateBulkSMS = {
    id: '',
    batchId: '',
    numRecords: '...',
    messageType: '',
    sender: {
      id: 'JourneyBuilderCustomActivity',
      name: 'MarketingCloud',
      phoneNumber: '919743464658',
      party: {
        id: 'JourneyBuilderCustomActivity',
        role: 'SmsApiGateway',
        name: '',
        '@referredType': 'externalSystem',
      },
    },
    communicationMessages: [
      {
        id: '',
        content: '',
        isSensitive: '',
        description: 'Message Sent by Custom Activity in Journey Builder',
        countryCode: '',
        priority: '',
        template: '',
        characteristic: [],
        searchIndexes: [],
        receiver: [
          {
            id: '',
            name: 'ContactKey',
            phoneNumber: '',
            party: {
              id: '',
              role: 'Customer',
              name: 'ContactKey',
              '@referredType': 'Individual',
            },
          },
        ],
      },
      {
        id: '...',
        content: '...',
        '...': '...'
      }
    ]
  };

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
      enabled: false,
    });
    connection.trigger('requestTriggerEventDefinition');
    $('#spinner').hide();
  }

  // retrieves the existing configuration of the CA on initialization
  function init(data) {
    payload = data;
    nodeName = payload.name.replace(/\s+/g, '_');

    const hasInArguments = Boolean(
      payload.arguments
            && payload.arguments.execute
            && payload.arguments.execute.inArguments
            && payload.arguments.execute.inArguments.length > 0,
    );

    if (hasInArguments) {
      const args = data.arguments.execute.inArguments[0];
      messageContent = args.messageContent;
      messageChannel = args.messageChannel;
      senderName = args.senderName;
      category = args.category;
      subCategory = args.subCategory;
      priority = args.priority;
      isSensitive = args.isSensitive;
      isBulked = args.isBulked;
      messageTemplate = args.messageTemplate;
      characteristic = JSON.stringify(args.characteristic);
      if (characteristic) characteristic = characteristic.slice(1, -1);
      searchIndexes = JSON.stringify(args.searchIndexes);
      if (searchIndexes) searchIndexes = searchIndexes.slice(1, -1);

      $('#messageContent').val(messageContent);
      $('#messageChannel').val(messageChannel);
      $('#senderName').val(senderName);
      $('#category').val(category);
      $('#subCategory').val(subCategory);
      $('#priority').val(priority);
      $('#isSensitive').val(isSensitive);
      $('#isBulked').val(isBulked);
      $('#messageTemplate').val(messageTemplate);
      $('#characteristic').val(characteristic);
      $('#searchIndexes').val(searchIndexes);

      if (messageChannel == 'S2MS') {
        $('#smart_template_fields').show(); 
        $('#bulk_template_fields').show()
      }
      
      if (isBulked == 'True') {
        $('#bulk_template_fields').show()
      }

      updateNextButton(isStepOneValid());
    }
  }

  // retrieves the dataExtensionKey and eventDefinitionKey on initialization
  function onRequestedTriggerEventDefinition(eventDefinitionModel) {
    if (eventDefinitionModel) {
      journeyName = eventDefinitionModel.name.replace(/\s+/g, '_');
      if (eventDefinitionModel.dataExtensionId) {
        eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
      } else {
        $('#notify').addClass('notifyActive');
        $('#notify').show();
        $('#notify').text(
          'There is no entry source configured for this journey, please select an entry data extension',
        );
      }
    }
    updateNextButton(isStepOneValid());
  }

  /** CONTROLS RELATED* */

  // calls the functions that are needed for the next step of the custom activity
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
    $(`#${currentStep.key}`).show();
  }

  function updateNextButton(enabled) {
    connection.trigger('updateButton', {
      button: 'next',
      enabled,
    });
  }

  function isValidValue(value) {
    return $.trim(value).length > 0;
  }

  /** STEP 1 RELATED FUNCTIONS* */

  function isStepOneValid() {
    return (
      isValidValue(messageContent) && isValidValue(messageChannel) && isValidValue(senderName)
                && isValidValue(priority) && isValidValue(isSensitive) && isValidValue(isBulked)
                && prepareCharacteristic() && prepareSearchIndexes() && checkIdValueLength()
    );
  }

  function getChannelValue() {
    return $('#messageChannel option:selected')
      .val()
      .trim();
  }

  function getPriorityValue() {
    return $('#priority option:selected')
      .val()
      .trim();
  }

  function getIsSensitiveValue() {
    return $('#isSensitive option:selected')
      .val()
      .trim();
  }

  function getIsBulkedValue() {
    return $('#isBulked option:selected')
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

  function getCategoryValue() {
    return $('#category')
      .val()
      .trim();
  }

  function getSubCategoryValue() {
    return $('#subCategory')
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

  function checkIdValueLength() {
    if ((journeyName+nodeName+category+subCategory).length < 130) {
      $('#notify').hide();
      return true;
    }
    else {
      $('#notify').addClass('notifyActive');
      $('#notify').show();
      $('#notify').text(
        'Your journey name, activity name, category and sub category are over 130 characters, please fix to continue',
      );
      return false;
    }
  }

  function prepareCharacteristic() {
    characteristic = getCharacteristicValue();
    characteristic = characteristic.replaceAll(/\s/g, '').replaceAll('},{', '}},{{');
    characteristic = characteristic.split('},{');

    if (characteristic[0]) {
      try {
        characteristic.forEach((char, index) => {
          const tempChar = JSON.parse(char);
          if (!tempChar.value) throw new Error();
          tempChar.value = tempChar.value.replace(/{{(.*?)}}/gi, (x) => {
            if (tempChar.value.search('{{Event.') > -1) return x;
            return `{{Event.${eventDefinitionKey}.${x.slice(2, -2).trim()}}}`;
          });
          characteristic[index] = tempChar;
        });
        $('#notify').hide();
        return true;
      } catch (err) {
        $('#notify').addClass('notifyActive');
        $('#notify').show();
        $('#notify').text(
          'There is an error with your characteristic object, please fix to continue',
        );
        return false;
      }
    } else {
      characteristic = [];
      $('#notify').hide();
      return true;
    }
  }

  function prepareSearchIndexes() {
    searchIndexes = getSearchIndexesValue();
    searchIndexes = searchIndexes.replaceAll(/\s/g, '').replaceAll('},{', '}},{{');
    searchIndexes = searchIndexes.split('},{');

    if (searchIndexes[0]) {
      try {
        searchIndexes.forEach((char, index) => {
          const tempChar = JSON.parse(char);
          searchIndexes[index] = tempChar;
        });
        $('#notify').hide();
        return true;
      } catch (err) {
        $('#notify').addClass('notifyActive');
        $('#notify').show();
        $('#notify').text(
          'There is an error with your searchIndexes object, please fix to continue',
        );
        return false;
      }
    } else {
      searchIndexes = [];
      $('#notify').hide();
      return true;
    }
  }

  $('#messageChannel').change(() => {
    messageChannel = getChannelValue();
    if (messageChannel == 'S2MS') {
      $('#smart_template_fields').show(); 
      $('#bulk_template_fields').show()
    } else if (isBulked == 'True') {
      $('#smart_template_fields').hide();
    } else {
      $('#smart_template_fields').hide(); 
      $('#bulk_template_fields').hide()
    }
    updateNextButton(isStepOneValid());
  });

  $('#priority').change(() => {
    priority = getPriorityValue();
    updateNextButton(isStepOneValid());
  });

  $('#isSensitive').change(() => {
    isSensitive = getIsSensitiveValue();
    updateNextButton(isStepOneValid());
  });

  $('#isBulked').change(() => {
    isBulked = getIsBulkedValue();
    if (isBulked == 'True') {
      $('#bulk_template_fields').show()
    } else if (messageChannel !== 'S2MS') {
      $('#bulk_template_fields').hide();
    }
    updateNextButton(isStepOneValid());
  });

  $('#messageContent').keyup(() => {
    messageContent = getContentValue();
    messageContent = messageContent.replaceAll(/{{(.*?)}}/gi, (x) => {
      if (x.search('{{Event.') > -1) return x;
      return `{{Event.${eventDefinitionKey}.${x.slice(2, -2).trim()}}}`;
    });
    updateNextButton(isStepOneValid());
  });

  $('#senderName').keyup(() => {
    senderName = getSenderNameValue();
    updateNextButton(isStepOneValid());
  });

  $('#category').keyup(() => {
    category = getCategoryValue();
    updateNextButton(isStepOneValid());
  });

  $('#subCategory').keyup(() => {
    subCategory = getSubCategoryValue();
    updateNextButton(isStepOneValid());
  });

  $('#messageTemplate').keyup(() => {
    messageTemplate = getTemplateValue();
    updateNextButton(isStepOneValid());
  });

  $('#characteristic').keyup(() => {
    updateNextButton(isStepOneValid());
  });

  $('#searchIndexes').keyup(() => {
    updateNextButton(isStepOneValid());
  });

  /** STEP 2 RELATED FUNCTIONS* */
  function setReviewPageVariables() {
    messageObject = {};
    // messageObject['id'] = `{{Event.${eventDefinitionKey}.id}}`;
    messageObject.id = `${journeyName}|${nodeName}|${category}|${subCategory}|` + '{{Contact.Key}}';
    messageObject.mobileNumber = `{{Event.${eventDefinitionKey}.mobileNumber}}`;
    messageObject.ContactKey = '{{Contact.Key}}';
    messageObject.messageContent = messageContent;
    messageObject.senderName = senderName;
    messageObject.category = category;
    messageObject.subCategory = subCategory;
    messageObject.priority = priority;
    messageObject.isSensitive = isSensitive;
    messageObject.isBulked = isBulked;

    if (messageChannel == 'S2MS' || isBulked == 'True') {
      if (characteristic.length) {
        messageObject.characteristic = characteristic;
      }

      if (searchIndexes.length) {
        messageObject.searchIndexes = searchIndexes;
      }
    }

    if (messageChannel == 'S2MS') {
      messageObject.mobileCountryCode = `{{Event.${eventDefinitionKey}.smartCountryCode}}`;
      messageObject.messageChannel = 'S2MS';
      messageObject.messageTemplate = messageTemplate;
    } else {
      messageObject.messageChannel = messageChannel;
      messageObject.mobileCountryCode = `{{Event.${eventDefinitionKey}.mobileCountryCode}}`;
    }

    if (isBulked == 'True') {
      const numCharctArray = (messageObject.id.match(/|/g) || []).length - 1;
      const batchId = messageObject.id.split('|')
        .slice(0, numCharctArray)
        .join('|') || messageObject.id;
      templateBulkSMS.id = 'f924315e-79d8-429d-ab3c-ae9704a0f006';
      templateBulkSMS.batchId = batchId;
      templateBulkSMS.messageType = messageObject.messageChannel;
      templateBulkSMS.sender.party.name = messageObject.senderName;
      templateBulkSMS.communicationMessages[0].id = messageObject.id;
      templateBulkSMS.communicationMessages[0].content = messageObject.messageContent;
      templateBulkSMS.communicationMessages[0].countryCode = messageObject.mobileCountryCode;
      templateBulkSMS.communicationMessages[0].priority = messageObject.priority;
      templateBulkSMS.communicationMessages[0].isSensitive = messageObject.isSensitive;
      templateBulkSMS.communicationMessages[0].template = messageObject.messageTemplate;
      templateBulkSMS.communicationMessages[0].characteristic = messageObject.characteristic;
      templateBulkSMS.communicationMessages[0].searchIndexes = messageObject.searchIndexes;
      templateBulkSMS.communicationMessages[0].receiver[0].id = messageObject.ContactKey;
      templateBulkSMS.communicationMessages[0].receiver[0].phoneNumber = messageObject.mobileNumber;
      templateBulkSMS.communicationMessages[0].receiver[0].party.id = messageObject.ContactKey;
      $('#review_message').text(JSON.stringify(templateBulkSMS, undefined, 2));
    } else {
      templateSMS.id = messageObject.id;
      templateSMS.content = messageObject.messageContent;
      templateSMS.messageType = messageObject.messageChannel;
      templateSMS.countryCode = messageObject.mobileCountryCode;
      templateSMS.priority = messageObject.priority;
      templateSMS.isSensitive = messageObject.isSensitive;
      templateSMS.template = messageObject.messageTemplate;
      templateSMS.characteristic = messageObject.characteristic;
      templateSMS.searchIndexes = messageObject.searchIndexes;
      templateSMS.receiver[0].id = messageObject.ContactKey;
      templateSMS.receiver[0].phoneNumber = messageObject.mobileNumber;
      templateSMS.receiver[0].party.id = messageObject.ContactKey;
      templateSMS.sender.party.name = messageObject.senderName;
       $('#review_message').text(JSON.stringify(templateSMS, undefined, 2));
    }
  }

  // saves the Custom Activity inarguments which will be referenced during journey runtime
  function onActivityComplete() {
    payload.arguments.execute.inArguments.length = 0;
    payload.arguments.execute.inArguments.push(messageObject);

    payload.metaData.isConfigured = true;

    connection.trigger('updateActivity', payload);
    updateNextButton(true);
  }
});
