// CONFIGURATION
JSONEditor.defaults.theme = 'bootstrap3';
JSONEditor.defaults.iconlib = 'bootstrap3';
// GLOBAL VARIABLES
var parsedSchema, firstLoad, languages, currentLanguage, contentURL;
// ONLOAD FUNCTION
$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  $.getJSON( "config.json", function(data) {
    // LOADING CONFIGURATION
    firstLoad = data.firstLoad;
    currentLanguage  = data.currentLanguage;
    languages = data.languages;
    contentURL = data.contentURL;
    // INIT
    var items = [];
    var itemsLang = [];
    $.each(languages, function() {
      if(this.id != 'en') {
        itemsLang.push('<li class="langItem" x-language="' + this.id + '"><a><span class="flag-icon flag-icon-' + this.id +'"></span> ' + this.name + ' <span style="display: none" class="glyphicon glyphicon-asterisk"></span></a></li><br>');
      } else {
        itemsLang.push('<li class="langItem" x-language="' + this.id + '"><a><span class="flag-icon flag-icon-gb"></span> ' + this.name + ' <span style="display: none" class="glyphicon glyphicon-asterisk"></span></a></li><br>');
      }
    });
    // APPEND ITEMS TO UL AND REGISTER ONCLICK
    $('#items-lang').append(itemsLang);
    $('#dropdown-language.dropdown-toggle').append('<span class="badge">' + languages.length + '</span>');
    addMenuClickEvents();
    setLanguageButtonLabel();
    // OPEN FILE
    openFile();
    document.getElementById('dropdown-language').classList.remove("disabled");
  });
});
// JSON EDITOR CONFIG
var currentEditor = null;
menuOnClick = function(schemaURL, translationLanguage) {
  loadJSON(schemaURL, function(schemaData) {
    if (currentEditor != null) {
      currentEditor.destroy();
    }
    var editor = new JSONEditor(document.getElementById('editor_holder'),{
      schema: schemaData
    });
    var hash = hashSHA256(schemaData);
    selectedMenuItemHash = hash;
    console.log("Current hash: " + hash);
    var dataURL = contentURL + '/schema-' + hash + '/data-' + translationLanguage + '-latest.json';
    loadJSON(dataURL, function(fileData) {
      editor.setValue(fileData);
      document.getElementById('editorButtons').style.display = '';
    });
    currentEditor = editor;
    editor.on('change',function() {
      var errors = editor.validate();
      var indicator = document.getElementById('valid_indicator');
      if(errors.length) {
        indicator.className = 'label alert';
        indicator.textContent = 'Status: not valid';
        indicator.style.color = 'red';
      } else {
        indicator.className = 'label success';
        indicator.textContent = 'Status: valid';
        indicator.style.color = 'green';
      }
    });
  });
};
loadJSON = function(filePath, callback) {
  $.ajax({
    url: filePath,
    dataType: 'json',
    type: 'GET',
    success: function (data) {
      callback(data);
    }
  });
}
// MENU AND EVENT HANDLERS
addMenuClickEvents = function() {
  var menuLangItems = document.getElementsByClassName('langItem');
  for (var i = 0; i < menuLangItems.length; i++) {
    menuLangItems[i].addEventListener("click", function() {
      showDialog('You are about to switch your language to <strong>' + this.getAttribute('x-language') + '</strong>. All the unsaved changes will be lost. Continue?', 'changeLang', 'Let me change!', 'Take me back', this);
    });
  }
}
document.getElementById('downloadFile').addEventListener('click', function() {
  showDialog('Download this file?', 'download', 'Yes', 'No');
});
hashSHA256 = function(input) {
  return CryptoJS.SHA256(JSON.stringify(input)).toString(CryptoJS.enc.Hex).slice(0,8);
}
downloadFile = function() {
  if(currentEditor) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentEditor.getValue(), null, 2)));
    element.setAttribute('download', 'schema-' + selectedMenuItemHash + '/data-' + currentLanguage + '-latest.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
openFile = function() {
  menuOnClick(contentURL + '/' + 'schema-latest.json', currentLanguage);
}
changeLang = function(menuItem) {
  currentLanguage = menuItem.getAttribute('x-language');
  setLanguageButtonLabel();
  menuOnClick(contentURL + '/' + 'schema-latest.json', currentLanguage);
}
setLanguageButtonLabel = function() {
  document.getElementById('dropdown-language').innerHTML = 'Language <span class="caret"></span><span class="badge">' + languages.length + ' (' + currentLanguage + ')' + '</span>';
}
function showDialog(dMessage, action, dB1, dB2, thisButton) {
  dB1 = dB1 || 'Ok!';
  dB2 = dB2 || 'Cancel'
  BootstrapDialog.show({
    title: 'Confirmation Promt',
    message: dMessage,
    buttons: [{
      icon: 'glyphicon glyphicon-ok',
      label: dB1,
      cssClass: 'btn-success',
      // IF CONFIRMATION IS TRUE
      action: function(dialogItself) {
        switch(action) {
          case 'change':
            changeFile(thisButton);
            break;
          case 'changeLang':
            changeLang(thisButton);
            break;
          case 'download':
            downloadFile(thisButton);
            break;
          }
          dialogItself.close();
        }
      }, {
      icon: 'glyphicon glyphicon-remove',
      label: dB2,
      cssClass: 'btn-danger',
      action: function(dialogItself) {
         dialogItself.close();
      }
    }]
  });
}
