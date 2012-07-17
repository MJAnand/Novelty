﻿/*		Apply_Masterpage_To_Style.jsx	Bruno Herfst 2010	An InDesign CS5 script to apply the selected Master Spread 	to any page that contains the searchresult	*/var the_document = app.documents.item(0);// Create a list of paragraph stylesvar list_of_paragraph_styles = the_document.paragraphStyles.everyItem().name;list_of_paragraph_styles.unshift("--ANY STYLE--");// Create a list of master pagesvar list_of_master_pages = the_document.masterSpreads.everyItem().name;// Make the dialog box for selecting the paragraph stylesvar the_dialog = app.dialogs.add({name:"add master to pages containing style"});with(the_dialog.dialogColumns.add()){	with(dialogRows.add()){		staticTexts.add({staticLabel:"Find:"});		var find_paragraph = dropdowns.add({stringList:list_of_paragraph_styles, selectedIndex:0});	}	with(borderPanels.add()){		// A decorative checkbox :)		var myGREPCheckbox = checkboxControls.add({staticLabel:"Custom GREP:", checkedState:true});		var myGREPField = textEditboxes.add({editContents:"^.+"});	}	with(dialogRows.add()){		staticTexts.add({staticLabel:"Apply master:"});		var change_master = dropdowns.add({stringList:list_of_master_pages, selectedIndex:0});	}	with(borderPanels.add()){		var myRMCheckbox = checkboxControls.add({staticLabel:"Replace masters first", checkedState:true});		var replace_master = dropdowns.add({stringList:list_of_master_pages, selectedIndex:0});	}}var myResult = the_dialog.show();if(myResult == true){	// Define variables	if (find_paragraph.selectedIndex == 0) {		var find_paragraph = false;	} else {		var find_paragraph = the_document.paragraphStyles.item(find_paragraph.selectedIndex-1);	}	var change_master = the_document.masterSpreads.item(change_master.selectedIndex);	var replace_master = the_document.masterSpreads.item(replace_master.selectedIndex);	var myRM = myRMCheckbox.checkedState;	var myGREP = myGREPCheckbox.checkedState;		if(myGREP == true && myGREPField.editContents != "" && myGREPField.editContents != "^") { //Find paragraph ^ is buggy in CS5 it will only find the first one not the next		var find_what = myGREPField.editContents;	} else {		var find_what = "^.+";	}		if (myRM == true) {		// Find and replace the pages		for(var myCounter = 0; myCounter < the_document.pages.length; myCounter++){			myPage = the_document.pages.item(myCounter);			if (myPage.appliedMaster == change_master){				myPage.appliedMaster = replace_master;			}		}	}		// Set find grep preferences to find all paragraphs with the selected paragraph style	app.findChangeGrepOptions.includeFootnotes = false;	app.findChangeGrepOptions.includeHiddenLayers = false;	app.findChangeGrepOptions.includeLockedLayersForFind = false;	app.findChangeGrepOptions.includeLockedStoriesForFind = false;	app.findChangeGrepOptions.includeMasterPages = false;		app.findGrepPreferences = NothingEnum.nothing;	if(find_paragraph == false){		app.findGrepPreferences.appliedParagraphStyle = NothingEnum.nothing;	} else {		app.findGrepPreferences.appliedParagraphStyle = find_paragraph;	}	app.findGrepPreferences.findWhat = find_what;	//Search the current story	var found_paragraphs = the_document.findGrep();	var myCounter = 0;	var myMessage = 0;	do {		try {			// Create an object reference to the found paragraph and the next			// for CS4 parent i.s.o parentPage			var myPage = found_paragraphs[myCounter].insertionPoints[0].parentTextFrames[0].parentPage;			myPage.appliedMaster = change_master;			myCounter++;		} catch(err) {			myMessage = err;			myMessage = "Couldn’t find anything!";		}	} while (myCounter < found_paragraphs.length);		if(myMessage == 0){		var myMessage = "Done placing "+(myCounter)+" master pages!";	} alert(myMessage);} else {	exit();}