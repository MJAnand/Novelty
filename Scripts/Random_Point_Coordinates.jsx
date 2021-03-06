/*

    Random_Point_Coordinates.jsx
    Version 1.5
    Bruno Herfst 2014 - 2018

    This script randomises the coordinates of all points of a given object
*/

#target InDesign

// We need some interface for this but have no time today...
var AllSettings = {
    DDR_drawnlines : {
        name                : "Dragons Devils and Rebels: drawn lines",
        randomisePoints     : true,
        onlyStraightLines   : false,
        subDivisions        : 2,
        subDivChancePercent : 80,
        minDistance         : 20,
        maxmovement         : 1.75,
        zigzag              : 0
    },
    Subdevider : {
        name                : "Standard",
        randomisePoints     : false,   // Set this to true for anchors to move set by maxmovement below
        onlyStraightLines   : false,  // Remove all curves if set to true
        subDivisions        : 2,      // How many times this scripts runs each try to divide a segment in half. (It would be cool to add a weighting number to this)
        subDivChancePercent : 50,     // Chance of subdivision in percentages. Set to 100 to always subdivide a section. The lower the number the lower the chances.
        minDistance         : 10,     // The minimum distance between points. If minimum distance is reached there will be no more subdivision. (current measure units)
        maxmovement         : 1,      // Max movement in any direction (current measure units)
        zigzag              : 0       // zigzag points (at the moment this is crude, it would work nicer with an interpolated point)
    },
    Standard : {
        name                : "Standard",
        randomisePoints     : true,   // Set this to true for anchors to move set by maxmovement below
        onlyStraightLines   : false,  // Remove all curves if set to true
        subDivisions        : 2,      // How many times this scripts runs each try to divide a segment in half. (It would be cool to add a weighting number to this)
        subDivChancePercent : 50,     // Chance of subdivision in percentages. Set to 100 to always subdivide a section. The lower the number the lower the chances.
        minDistance         : 4.5,     // The minimum distance between points. If minimum distance is reached there will be no more subdivision. (current measure units)
        maxmovement         : 1.0,      // Max movement in any direction (current measure units)
        zigzag              : 0       // zigzag points (at the moment this is crude, it would work nicer with an interpolated point)
    },
    RemoveCurves : {
        name                : "Convert curves to straight lines",
        randomisePoints     : false,
        onlyStraightLines   : true,
        subDivisions        : 0,
        subDivChancePercent : 0,
        minDistance         : 0,
        maxmovement         : 0,
        zigzag              : 0
    },
    IckypediaBlast : {
        name                : "Ickypedia: Blast from the past",
        randomisePoints     : false,
        onlyStraightLines   : true,
        subDivisions        : 4,
        subDivChancePercent : 100,
        minDistance         : 10,
        maxmovement         : 10,
        zigzag              : 2
    },
    IckypediaBlackHeader : {
        name                : "Ickypedia: Black Header",
        randomisePoints     : true,
        onlyStraightLines   : true,
        subDivisions        : 0,
        subDivChancePercent : 100,
        minDistance         : 15,
        maxmovement         : 2,
        zigzag              : 0
    },

    IckypediaComicFrames : {
        name                : "Ickypedia: Comic Frames",
        randomisePoints     : true,
        onlyStraightLines   : true,
        subDivisions        : 1,
        subDivChancePercent : 100,
        minDistance         : 15,
        maxmovement         : 1.5,
        zigzag              : 0
    },

    IckypediaBlackWords : {
        name                : "Ickypedia: Black Words",
        randomisePoints     : true,
        onlyStraightLines   : true,
        subDivisions        : 2,
        subDivChancePercent : 100,
        minDistance         : 9,
        maxmovement         : 0.5,
        zigzag              : 0
    },

    IckypediaWhiteBackgrounds : {
        name                : "Ickypedia: White Text Snippets",
        randomisePoints     : true,
        onlyStraightLines   : false,
        subDivisions        : 2,
        subDivChancePercent : 100,
        minDistance         : 15,
        maxmovement         : 0.5,
        zigzag              : 0
    }
}
var Settings;
var dozigzag = true;

var myPathList = [];

//Make certain that user interaction (display of dialogs, etc.) is turned on.
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;


//Check if we have what we need to run the script.
if (app.documents.length == 0){
    alert("Open a document before running this script.");
    exit();
}

if ( app.selection.length > 0 ) {
    for(var i = 0;i < app.selection.length; i++){
        switch (app.selection[i].constructor.name){
            case "Rectangle":
            case "TextFrame":
            case "Oval":
            case "Polygon":
            case "GraphicLine":
            case "Group":
            case "PageItem":
            myPathList.push(app.selection[i]);
            break;
        }
    }
    if (myPathList.length == 0){
        alert ("Select a rectangle or text frame and try again.");
        exit();
    }
} else {
    var myDoc = app.documents[0];
    var allLabels = [];

    function unique (array) {  
       var o = {}, i, l = array.length, r = [];  
       for(i=0; i<l;i++) o[array[i]] = array[i];  
       for(i in o) r.push(o[i]);  
       return r;  
    };

    function collectLabels( myPageItems ) {
        for(var i = 0; i < myPageItems.length; i++){
        	switch (myPageItems[i].constructor.name){
                case "Group":
                case "PageItem":
                    collectLabels(myPageItems[i].allPageItems);
                    break;
                case "Rectangle":
                case "TextFrame":
                case "Oval":
                case "Polygon":
                case "GraphicLine":
                    allLabels.push(myPageItems[i].label);
                    break;
                default:
                    break;
            }
        }
    }

    collectLabels( myDoc.pageItems );

    allLabels = unique( allLabels );

    if(allLabels.length == 0) {
        alert ("Could not find any script labels.\nSelect a rectangle or text frame and try again.");
        exit();
    }

    // Make the dialog box with script labels
    var dlg = app.dialogs.add({name:"Target:"});
    with(dlg.dialogColumns.add()){
        var labelDrop = dropdowns.add({stringList:allLabels, selectedIndex:0});
    }

    //show dialog
    if(dlg.show() == true){
        var myLabel = allLabels[labelDrop.selectedIndex];
        myPathList = getPageItemsWithLabel(myDoc, myLabel);
        
        if (myPathList.length == 0){
            alert ("Could not find any suitable page items with label: " + myLabel);
            exit();
        }
    } else {
        // User pressed cancel
        exit();
    }
}

try {
  // Run script with single undo if supported
  if (parseFloat(app.version) < 6) {
    showSettingsUI();
  } else {
    app.doScript(showSettingsUI, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Expand State Abbreviations");
  }
  // Global error reporting
} catch ( error ) {
  alert(error + " (Line " + error.line + " in file " + error.fileName + ")");
}

function getPageItemsWithLabel(doc,label) {
	var myItems = [];

	function collectItems( myPageItems ) {
        for(var i = 0; i < myPageItems.length; i++){
        	switch (myPageItems[i].constructor.name){
                case "Group":
                case "PageItem":
                    collectItems(myPageItems[i].allPageItems);
                    break;
                case "Rectangle":
                case "TextFrame":
                case "Oval":
                case "Polygon":
                case "GraphicLine":
                	if(myPageItems[i].label == label) {
                		myItems.push(myPageItems[i]);
                	}
                    break;
                default:
                    break;
            }
        }
    };

    collectItems(doc.pageItems);

    return myItems;
}

function showSettingsUI(){
    var keys = [], i = 0;
    for (keys[i++] in AllSettings) {}

    // Make the dialog box for selecting the paragraph styles
    var dlg = app.dialogs.add({name:"Randomise Path Points"});
    with(dlg.dialogColumns.add()){
        var settingsDrop = dropdowns.add({stringList:keys, selectedIndex:0});
    }

    //show dialog
    if(dlg.show() == true){
        Settings = AllSettings[keys[settingsDrop.selectedIndex]];
        randomisePaths(myPathList);
    }
}

function randomisePaths(myPathList){
    for(var objCount = 0;objCount < myPathList.length; objCount++){
        for(var pathCount = 0;pathCount < myPathList[objCount].paths.length; pathCount++){
            var objBounds = myPathList[objCount].geometricBounds;
            var myPath = myPathList[objCount].paths[pathCount];
            if(Settings.subDivisions > 0){
                var counter = 0;
                do {
                   counter += 1;
                   addPoints(myPath);
                } while (counter < Settings.subDivisions);
            }
            if(Settings.randomisePoints){
                randomisePathPoints(myPath);
            }
            if(Settings.onlyStraightLines){
                removeCurves(myPath);
            }
            if((!isNaN(Settings.zigzag)) && (Settings.zigzag != 0)){
                zigzag(myPath,objBounds);
            }
        }
    }
}

function zigzag(myPath,objBounds){
    depth = Settings.zigzag;
    mid_Y = objBounds[0] + ((objBounds[2]-objBounds[0])/2); //YX YX
    mid_X = objBounds[1] + ((objBounds[3]-objBounds[1])/2); //01 23
    try{
        for(var point = 0;point < myPath.pathPoints.length; point++){
            if(point % 2 == 0){ // only move even numbers
                var current_X = myPath.pathPoints[point].anchor[0];
                var current_Y = myPath.pathPoints[point].anchor[1];
                var zigzag_X = current_X;
                var zigzag_Y = current_Y;

                if(current_X >= mid_X) {
                    zigzag_X += depth;
                } else {
                    zigzag_X -= depth;
                }
                if(current_Y >= mid_Y) {
                    zigzag_Y += depth;
                } else {
                    zigzag_Y -= depth;
                }

                myPath.pathPoints[point].anchor = [zigzag_X, zigzag_Y];
            }
        }
    } catch(err){
        alert(err);
    }

}

function addPoints(myPath){

    if(myPath.pathType == PathType.CLOSED_PATH){
        var doLastVector = true;
    } else if (myPath.pathType == PathType.OPEN_PATH) {
        var doLastVector = false;
    } else {
        alert("Can’t determine path type");
        return;
    }

    var oldPath = handlePath(myPath.entirePath);
    var newPath = new Array();

    if(oldPath.length > 1){
        //add first point to newPath
        newPath.push(oldPath[0]);
        var dist;

        for(var point = 0;point < oldPath.length-1; point++){ //we process last point later for closed paths only
            //Check if distance between points is bigger then minimal distance
            dist = getDistance(oldPath[point],oldPath[point+1]);
            if((dist > Settings.minDistance) && (randomInRange(1,100) <= Settings.subDivChancePercent)){ // Add points
                // Add new interpolated path point with the next
                var newSegment = getInterpolatedPoint([ oldPath[point],oldPath[point+1] ]);
                // New Segment contains 3 points
                // Update last previous handle first
                newPath[newPath.length-1][2] = newSegment[0][2];
                // Add the other two
                newPath.push(newSegment[1]); // New point
                newPath.push(newSegment[2]); // Adjusted old point right handle updated next in loop
            } else {
                newPath.push(oldPath[point+1]);
            }
        }
        // deal with last point
        if(doLastVector){
            dist = getDistance(oldPath[oldPath.length-1],oldPath[0]);
            if(dist > Settings.minDistance){ // Add points
                // Add new interpolated path point with the first
                var newSegment = getInterpolatedPoint([ oldPath[oldPath.length-1], oldPath[0] ]);
                // Update last handle first
                newPath[newPath.length-1][2] = newSegment[0][2];
                // Add the mid point
                newPath.push(newSegment[1]); // New point
                // Update first point
                newPath[0][0] = newSegment[2][0];
            } else {
                // Do nothing
            }
        }
        myPath.entirePath = newPath;
    }
}

function getInterpolatedPoint(segment){
    // param:  segment: Array of two   points [p1, p2]
    // [[leftHandle,actualPoint,rightHandle],[leftHandle,actualPoint,rightHandle]]
    // return: segment: Array of three points [p1, p0, p2] where p0 is interpolated

    var p1 = segment[0];
    var p2 = segment[1];
    var p0 = [0,0,0];

    try{
        if(p1.length == 3 && p2.length == 3){
            /*
            given  midpoint  midpoint  midpoint
            (0, 0)
                  \
                   (1/2, 0)
                  /        \
            (1, 0)          (3/4, 1/4)
                  \        /          \
                   (1, 1/2)            (3/4, 1/2)
                  /        \          /
            (1, 1)          (3/4, 3/4)
                  \        /
                   (1/2, 1)
                  /
            (0, 1)
            */

            var p1actualPoint = p1[1];
            var p1rightHandle = p1[2];
            var p2leftHandle  = p2[0];
            var p2actualPoint = p2[1];

            //MIDPOINT 3
            var p1mid = getHalfwayPoint(p1actualPoint,p1rightHandle);
            var p0mid = getHalfwayPoint(p1rightHandle,p2leftHandle);
            var p2mid = getHalfwayPoint(p2leftHandle,p2actualPoint);

            //MIDPOINT 2
            var p1midpoint = getHalfwayPoint(p1mid,p0mid);
            var p2midpoint = getHalfwayPoint(p0mid,p2mid);

            //MIDPOINT 1
            var p0midpoint = getHalfwayPoint(p1midpoint,p2midpoint);

            return [ [p2[0],p1actualPoint,p1mid] , [p1midpoint,p0midpoint,p2midpoint], [p2mid,p2actualPoint,p2[2]] ];
        }
    }catch(E){
        alert("Ooops: " + E);
    }
    alert("Something went wrong");
    exit();
}

function getDistance(p1,p2){
    var x = p2[1][0] - p1[1][0];
    var y = p2[1][1] - p1[1][1];
    return Math.sqrt( x*x + y*y );
}

function getHalfwayPoint(p1,p2){
    if(p2.length > 2 || p2.length > 2){
        alert("getHalfwayPoint: Invalid arguments.");
        exit();
    }
    // param array [x,y] * 2
    var p1X = p1[0];
    var p1Y = p1[1];
    var p2X = p2[0];
    var p2Y = p2[1];
    var p0X = (p2X-p1X)*0.5 +p1X;
    var p0Y = (p2Y-p1Y)*0.5 +p1Y;
    //var p0X = (p1X + p2X)*0.5;
    //var p0Y = (p1Y + p2Y)*0.5;
    return [p0X, p0Y];
}

function handlePath(myEntirePath){
    // Return array of path points with control handles
    var newPath = new Array;
    for(var point = 0;point < myEntirePath.length; point++){ //we process last point later for closed paths only
        if(myEntirePath[point].length == 2){
            var actualPoint = myEntirePath[point];
            var leftHandle  = myEntirePath[point];
            var rightHandle = myEntirePath[point];
        } else {
            var leftHandle  = myEntirePath[point][0];
            var actualPoint = myEntirePath[point][1];
            var rightHandle = myEntirePath[point][2];
        }
        newPath.push([leftHandle,actualPoint,rightHandle]);
    }
    return newPath;
}

function removeCurves(myPath){
    var oldPath = handlePath(myPath.entirePath);
    var newPath = new Array();
    for(var point = 0;point < oldPath.length; point++){
        newPath.push(oldPath[point][1]);
    }
    myPath.entirePath = newPath;
}

function randomisePathPoints(myPath){
    try{
        for(var point = 0;point < myPath.pathPoints.length; point++){
            var current_X = myPath.pathPoints[point].anchor[0];
            var current_Y = myPath.pathPoints[point].anchor[1];
            var min_X = current_X - Settings.maxmovement;
            var max_X = current_X + Settings.maxmovement;
            var min_Y = current_Y - Settings.maxmovement;
            var max_Y = current_Y + Settings.maxmovement;
            myPath.pathPoints[point].anchor = [randomInRange(min_X,max_X), randomInRange(min_Y,max_Y)];
        }
    } catch(err){
        alert(err);
    }
}

function randomInRange(start,end){
    return Math.random() * (end - start) + start;
}
