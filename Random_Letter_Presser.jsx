/*

    Letter_Presser.jsx
    Version 1.4
    Experimental InDesign CS5+ JavaScript
    Bruno Herfst 2011 - 2016

    This script sets a randome baselineshift between two values
    to all text found in set style and location
    can also set random thin outlines for that extra letter-press feel.

    NOTE:
    Keep values nice and small!
    Subtlety is key.

*/

#target InDesign

//global variables
var AllSettings = {
	Standard : {
		name                 : "Standard",
		doCharacters         : false,
		doWords              : false,
		maxCharBaselineShift : 0,
		maxWordBaselineShift : 0,
		paragraphStyle       : "[None]",
		characterStyle       : "[None]",
		maxCharStrokeWidth   : 0,
		maxWordStrokeWidth   : 0
	},
	IckyPedia_Wordheaders : {
		name                 : "IckyPedia: Wordheaders",
		doCharacters         : true,
		doWords              : false,
		maxCharBaselineShift : 0.75,
		maxWordBaselineShift : 0.5,
		paragraphStyle       : "DICT_WORD",
		characterStyle       : "[None]",
		maxCharStrokeWidth   : 0.5,
		maxWordStrokeWidth   : 0.25
	},
	KickIt_Chapterheads : {
		name                  : "Kick it to Nick: Chaphead",
		doCharacters          : true,
		doWords               : false,
		maxCharBaselineShift  : 0.225,
		maxWordBaselineShift  : 0.1,
		paragraphStyle        : false,
		maxCharStrokeWidth    : 0,
		maxWordStrokeWidth    : 1
	}
}

var Settings = AllSettings.IckyPedia_Wordheaders;

//Make certain that user interaction (display of dialogs, etc.) is turned on.
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
if (app.documents.length != 0){
    try {
      // Run script with single undo if supported
      if (parseFloat(app.version) < 6) {
        main();
      } else {
        app.doScript(main, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Expand State Abbreviations");
      }
      // Global error reporting
    } catch ( error ) {
      alert( error + " (Line " + error.line + " in file " + error.fileName + ")");
    }
}else{
    alert("Open a document first before running this script.");
}

//============================================== FUNCTIONS =====================================================
function main(){
    var myDoc = app.activeDocument;

    // Create a list of paragraph styles
    var list_of_All_paragraph_styles = myDoc.paragraphStyles.everyItem().name;
    list_of_All_paragraph_styles.unshift("[Any paragraph style]");
    // Create a list of character styles
    var list_of_All_character_styles = myDoc.characterStyles.everyItem().name;
    list_of_All_character_styles.unshift("[Any character style]");
    // Create a list of locations
    var list_of_All_locations = ["Current Document"];

    // Let's see if there is text selected so we can set the UI already to the right spot.
    var paraSelection, charSelection = undefined;
    if(app.selection.length != 0){
        mS = myDoc.selection[0];
        if(mS.constructor.name == "Text" ||
           mS.constructor.name == "Word" ||
           mS.constructor.name == "Line" ||
           mS.constructor.name == "Character"  ||
           mS.constructor.name == "Paragraph"  ||
           mS.constructor.name == "TextColumn" ||
           mS.constructor.name == "TextStyleRange" ){
            //see what paragraph style the selection is
            paraSelection = mS.appliedParagraphStyle.name;
            charSelection = mS.appliedCharacterStyle.name;
            list_of_All_locations.unshift("Parent Story");
            list_of_All_locations.unshift("Selected Text");
        } else if (mS.constructor.name == "TextFrame"){
            list_of_All_locations.unshift("Parent Story");
        } else {
            // No need to add any find locations
            // alert(mS.constructor.name);
        }
    }

    // Make the dialog box for selecting the paragraph styles
    var dlg = app.dialogs.add({name:"LetterPresser"});
    with(dlg.dialogColumns.add()){
        with(dialogRows.add()){
            with(dialogColumns.add()){
                var find_locations = dropdowns.add({stringList:list_of_All_locations, selectedIndex:0});
                var find_paragraph = dropdowns.add({stringList:list_of_All_paragraph_styles, selectedIndex:0});
                //find_paragraph.selectedIndex = getIndex(paraSelection,list_of_All_paragraph_styles);
                var find_charStyle = dropdowns.add({stringList:list_of_All_character_styles, selectedIndex:0});
                //find_charStyle.selectedIndex = getIndex(charSelection,list_of_All_character_styles);
            }
        }
        staticTexts.add({staticLabel:""}); // Add some space to UI
        //var charOrWords = dropdowns.add({stringList:["Words","Characters"], selectedIndex:0});
        with(dialogRows.add()){
            var c = checkboxControls.add({ staticLabel : 'Set Characters:\t', checkedState : Settings.doCharacters });
            staticTexts.add({staticLabel:"Max Shift (Baseline):"});
            var myCharBlsField = measurementEditboxes.add({editUnits: MeasurementUnits.POINTS,editValue:Settings.maxCharBaselineShift});
            staticTexts.add({staticLabel:"Max Stroke (Pressure):"});
            var myCharSwField = measurementEditboxes.add({editUnits:MeasurementUnits.POINTS,editValue:Settings.maxCharStrokeWidth});
            staticTexts.add({staticLabel:"Max Add Points:"});
            var addMaxCharPoints = measurementEditboxes.add({editUnits:MeasurementUnits.POINTS,editValue:0});
        }
        with(dialogRows.add()){
           var w = checkboxControls.add({ staticLabel : 'Set Words:\t\t', checkedState : Settings.doWords });
            staticTexts.add({staticLabel:"Max Shift (Baseline):"});
            var myWordBlsField = measurementEditboxes.add({editUnits: MeasurementUnits.POINTS,editValue:Settings.maxWordBaselineShift});
            staticTexts.add({staticLabel:"Max Char Stroke (Pressure):"});
            var myWordSwField = measurementEditboxes.add({editUnits:MeasurementUnits.POINTS,editValue:Settings.maxWordStrokeWidth});
            staticTexts.add({staticLabel:"Max Word Stroke:"});
            var addMaxWordPoints = measurementEditboxes.add({editUnits:MeasurementUnits.POINTS,editValue:0});
        }
    }

    //show dialog
    if(dlg.show() == true){
        //get dialog data
        Settings.resetBaseline        = true;
        Settings.maxCharStrokeWidth   = myCharSwField.editValue;
        Settings.maxCharBaselineShift = myCharBlsField.editValue;
        Settings.maxCharAddPoints     = addMaxCharPoints.editValue;
        Settings.maxWordStrokeWidth   = myWordSwField.editValue;
        Settings.maxWordBaselineShift = myWordBlsField.editValue;
        Settings.maxWordAddPoints     = addMaxWordPoints.editValue;
        Settings.doCharacters         = c.checkedState;
        Settings.doWords              = w.checkedState;
        Settings.location             = find_locations.stringList[find_locations.selectedIndex];

        // Set selected styles
        if (find_paragraph.selectedIndex == 0) {
            Settings.paragraphStyle = false;
        } else {
            Settings.paragraphStyle = myDoc.paragraphStyles.item(find_paragraph.selectedIndex-1);
        }
        if (find_charStyle.selectedIndex == 0) {
            Settings.characterStyle = false;
        } else {
            Settings.characterStyle = myDoc.characterStyles.item(find_charStyle.selectedIndex-1);
        }

        if(Settings.doCharacters == false && Settings.doWords == false){
            alert("Did you meant to press cancel?");
            exit();
        }

        app.findChangeGrepOptions.includeFootnotes = false;
        app.findChangeGrepOptions.includeHiddenLayers = false;
        app.findChangeGrepOptions.includeLockedLayersForFind = false;
        app.findChangeGrepOptions.includeLockedStoriesForFind = false;
        app.findChangeGrepOptions.includeMasterPages = false;

        // reset grep preferences first
        app.findGrepPreferences = NothingEnum.nothing;

        if(Settings.paragraphStyle == false && Settings.characterStyle == false){
            app.findGrepPreferences.findWhat = ".+";
        } else {
            app.findGrepPreferences.findWhat = NothingEnum.nothing;
        }

        if(Settings.paragraphStyle == false){
            app.findGrepPreferences.appliedParagraphStyle = NothingEnum.nothing;
        } else {
            //this can throw an error if multi-find/change plugin is open
            app.findGrepPreferences.appliedParagraphStyle = Settings.paragraphStyle;
        }
        if(Settings.characterStyle == false){
            app.findGrepPreferences.appliedCharacterStyle = NothingEnum.nothing;
        } else {
            //this can throw an error if multi-find/change plugin is open
            app.findGrepPreferences.appliedCharacterStyle = Settings.characterStyle;
        }

        //Search
        switch(Settings.location){
            case "Current Document":
                var found_text = myDoc.findGrep();
                break;
            case "Parent Story":
                var found_text = myDoc.selection[0].parentStory.findGrep();
                break;
            case "Selected Text":
                var found_text = myDoc.selection[0].findGrep();
                break;
            default:
                alert("Something went wrong \nLocation unknown");
                exit();
        }

        if(found_text.length < 1){
            alert("Couldn't find anything!");
            exit();
        }

        var myCounter = 0;
        var myMessage = false;
        do {
            try {
                setCharOrWord(found_text[myCounter]);
            } catch(err) {
                myMessage = err;
            }
            myCounter++;
        } while (myCounter < found_text.length);

        if(myMessage == false){
            var myMessage = "Done!";
        }
        alert(myMessage);
        //the end
        dlg.destroy();
    } else {
        //cancel
    }
}

//-------------------------------------------------------------------------------------------------------------

function setCharOrWord(myLine){
    var MySettings = new Object();
        MySettings.resetBaseline    = Settings.resetBaseline;

    if(Settings.doWords) {
        MySettings.maxBaselineShift = Settings.maxWordBaselineShift;
        MySettings.maxStrokeWidth   = Settings.maxWordStrokeWidth;
        MySettings.maxAddPoints     = Settings.maxWordAddPoints;
        setText(myLine.words,MySettings);
    }
    if(Settings.doCharacters) {
        MySettings.maxBaselineShift = Settings.maxCharBaselineShift;
        MySettings.maxStrokeWidth   = Settings.maxCharStrokeWidth;
        MySettings.maxAddPoints     = Settings.maxCharAddPoints;
        setText(myLine.characters,MySettings);
    }
}

function setText(mySection,MySettings){
    var len = mySection.length;
    for (var i=0; i < len; i++){
         try{
            var myText = mySection[i];
            if(MySettings.maxStrokeWidth > 0){
                myText.strokeAlignment = TextStrokeAlign.CENTER_ALIGNMENT;
                myText.strokeWeight    = randomInRange(0,MySettings.maxStrokeWidth);
                myText.strokeColor     = myText.fillColor;
            } else {
                myText.strokeWeight    = 0;
                myText.strokeColor     = "None";
            }
            if(MySettings.maxAddPoints > 0){
                myText.pointSize      += randomInRange(0,MySettings.maxAddPoints);
            }
            if(MySettings.resetBaseline){
                myText.baselineShift   = randomInRange(-MySettings.maxBaselineShift,MySettings.maxBaselineShift);
            } else {
                myText.baselineShift  += randomInRange(-MySettings.maxBaselineShift,MySettings.maxBaselineShift);
            }
         }catch(r){
            alert(r.description);
            break;
        }
    }
}

function getIndex(item,array) {
    var count=array.length;
    for(var index=0;index<count;index++) {
        if(array[index]===item){return index;}
    }
    return 0;
}

function randomInRange(start,end){
       return Math.random() * (end - start) + start;
}
