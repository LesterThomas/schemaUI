// This module:
// 1. scans the input schemas folder and loads all the schemas into a single schemaArray. 
// 2. The homepage generates the HTML table from this schemaArray.
// 3. Calls to any other url under the homepage attempt to find the Entity in the array and display the entity details
var fs = require('fs');
var schemaObject={};
var schemaArray=[];
//common UI components
var header='<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">' +
        '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">' +
        '<script src="js/filtertable.js"></script>'+

        '<link rel="stylesheet" href="css/filtertable.css">' + 
        '<style type="text/css">.vodafonetext{ color: red; }' + 
        '.tmftext{ color: blue; }' + 
        'a{ color: black;    text-decoration: underline; }' +
        'a.vodafonetext{ color: red;    text-decoration: underline; }</style>';
var configObj={};


/***************************************************************************************
        on startup import files into the schemaArray
***************************************************************************************/
var HTMLGenerator = function(inputFoldersArray, outputFolder, inputConfig) {

	// load the inputConfig
	configObj = JSON.parse(fs.readFileSync(inputConfig,'utf8'));

	
	// import all the files from all the folders into the schemaObject
    for(var folder in inputFoldersArray){
        console.log("loading folder " + inputFoldersArray[folder]);
        var files = fs.readdirSync(inputFoldersArray[folder]);
        files.forEach(file => {
			console.log(file);
			if (file.substring(file.length-5)=='.json'){
				var importObj = JSON.parse(fs.readFileSync(inputFoldersArray[folder]+'/'+file,'utf8'));
				if (!importObj["$comment:status"]){
					importObj["$comment:status"]="Not validated";
				}
				if (importObj.definitions[importObj.title]){
					schemaObject[importObj.title]=importObj;
				}	else {
					console.warn("WARNING: Schema does not contain Entity with same name as Title for " + file);
				}
			}
        });
    } 

	// Sort the schemaObject into alphabetical order
    Object.keys(schemaObject)
        .sort()
        .forEach(function(key) {
            schemaArray.push(schemaObject[key]);
        }); 

	// build HTML and save .html and .json into separate files	
    for (var schemaKey in schemaArray) {
        var outputHTML = buildHTML(schemaArray[schemaKey].title);
        fs.writeFile(outputFolder + "/" + schemaArray[schemaKey].title + ".html" , outputHTML, function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
        fs.writeFile(outputFolder + "/" + schemaArray[schemaKey].title + ".json" , JSON.stringify(schemaArray[schemaKey], null, 2), function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
    }

	// buuld the HTML index file
    var indexHTML = buildIndexHTML();
    fs.writeFile(outputFolder + "/index.html" , indexHTML, function(err) {
        if(err) {
            return console.log(err);
        }
    }); 

	// buuld a Cache manifest file to tell browsers not to cache these files.
    var noCacheManifest = "CACHE MANIFEST \r\n" + 
        "#" + Date.now() + "\r\n" +
        "NETWORK:\r\n" + 
        "*\r\n";
        fs.writeFile(outputFolder + "/manifest.appcache" , noCacheManifest, function(err) {
            if(err) {
                return console.log(err);
            }
        }); 	
}


/***************************************************************************************
		Helper function to build the HTML for the Index
***************************************************************************************/
function buildIndexHTML(){
	var statusTH='';
	if (configObj.showStatus){
		statusTH='<th>Status</th>';
	}
	var propertyTable='<input type="text" id="myInput" onkeyup="myFunction()" placeholder="Search for entities.."><p><table id="myTable" class="table  table-striped table-bordered table-condensed"><tr><th>Entity Name</th><th>Machine readible</th><th>Description</th>' + statusTH + '</tr>';

	for(i=0;i<schemaArray.length;i++) {
		var progressImage=schemaArray[i]["$comment:status"];
		var statusTD='';
		if (configObj.showStatus){
			statusTD='<td><img src="images/' + progressImage + '.gif" title="' + progressImage + '"></td>';
		}		
		propertyTable=propertyTable+'<tr><td><p><a href="'+schemaArray[i].title+'.html">'+schemaArray[i].title+'</a> &nbsp; <td><a href="'+schemaArray[i].title+'.json">'+'.json'+'</a></td></p></td><td>' +  schemaArray[i].definitions[schemaArray[i].title].description + '</td>'+ statusTD + '</tr>';
	}

	propertyTable=propertyTable + '</table></p>';

	var footer='<br /><br /><p>' + configObj.copywright + ' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </p>';

	var body='<div class="container"><div class="navbar navbar-fixed-top" style="color:white;background-color:#666666; width:100%"><h2 style="color:white;">&nbsp;<a href="http://cim.vodafone.com"><img src="images/logo.png" ></img></a>&nbsp;&nbsp;' + configObj.title + '</h2></div></div>'+
		'<div class="container">' + '<br /><br /><br /><br /><br /><br /><h3 style="color:EE0000;"><b>' + configObj.heading + '</b></h3>' + 
		'<H4 style="color:grey;">' + configObj.draftWarning + '<br /><br />  ' + configObj.introduction + ' </H4>' +
		'<br /> <h2> Index</h2> '+propertyTable + footer + '</div>';
	var outputHTML= '<!DOCTYPE html>'
       + '<html manifest="manifest.appcache"><header>' + header + '</header><body role="document">' + body + '</body></html>';
	
	   return outputHTML;
}


/***************************************************************************************
		Helper function to build the HTML for an Entity
***************************************************************************************/

function buildHTML(inEntity){
	
	var outputEntity=getEntityByTitle(inEntity);
	console.log("INFO: Displaying entity " + inEntity);
	var title='<table style="width:100%"><tr><td><H1>' + outputEntity.title + '</H1></td><td align="right"><a href="' +  outputEntity.title + '.json">' + outputEntity.title + '.json</a></td></tr></table><br />';
	var body='';
	if (outputEntity=='') {
		body='<div class="container"><div class="navbar navbar-fixed-top" style="color:white;background-color:#666666; width:100%"><h2 style="color:white;">&nbsp;<a href="http://cim.vodafone.com"><img src="images/logo.png" ></img></a>&nbsp;&nbsp;' + configObj.title + '</h2></div></div>'+
		'<div class="container">  <br><br><br><br><br><br> Element not found. <a href="/">Back to Home</a></div>';
	} else {
		var outputEntityDefinitions = outputEntity.definitions[outputEntity.title];
		var inheritanceLinks = getInheritanceLinks(outputEntity.title, '');
		if (outputEntityDefinitions){
			if ( outputEntityDefinitions.allOf) {
				if (outputEntityDefinitions.allOf[0]['$comment:$ref']) {
					var tmfparent = outputEntityDefinitions.allOf[0]['$comment:$ref'].split('#')[1];
					inheritanceLinks = '<div class="vodafonetext">' + inheritanceLinks + ' (Proposed inheritance)</div><div class="tmftext"><a href="' + tmfparent + '.html">' + tmfparent + '</a> > <a href="' + outputEntity.title + '.html">' + outputEntity.title + '</a> (TM Forum inheritance)</div>';
				}
			}
		
			var entityDescription;
			if (outputEntityDefinitions['$comment:description']){
				entityDescription = '<p><div class="well"><div class="tmftext">' + outputEntityDefinitions['$comment:description'] + '</div><div class="vodafonetext">' + outputEntityDefinitions.description + '</div></div></p>';
			} else 
				entityDescription = '<p><div class="well">' + outputEntityDefinitions.description + '</div></p>';
		}
		var propertyTable = getPropertyTable(outputEntity.title, false);
		var removedPropertyTable = getRemovedPropertyTable(outputEntity.title);
		var instancesList = getInstances(outputEntity.title); 
		var referrersList = getReferrers(outputEntity.title); 
		var footer='<br /><br /><p>' + configObj.copywright + ' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </p>';

		body='<div class="container"><div class="navbar navbar-fixed-top" style="color:white;background-color:#666666; width:100%"><h2 style="color:white;">&nbsp;<a href="http://cim.vodafone.com"><img src="images/logo.png" ></img></a>&nbsp;&nbsp;' + configObj.title + '</h2></div></div>'+
			'<div class="container">' +  '<br><br><br><br><br><br><p><a href="index.html"> back</a></p>' + title + inheritanceLinks + entityDescription + removedPropertyTable + propertyTable + instancesList + referrersList + footer + '<br /></div>';
	}
		var outputHTML= '<!DOCTYPE html>'
	+ '<html manifest="manifest.appcache"><header>' + header + '</header><body role="document">'  + body +  '</body></html>';
	
	return(outputHTML);
}

/***************************************************************************************
		Helper function to build the navigation links e.g. Home > AppliedBillingRate 
		It is implemented as a recursive function
***************************************************************************************/
function getInheritanceLinks(inTitle, inInheritanceLink){

	//find entity in schemaArray with this title
	if (!(inInheritanceLink=='')) {
		inInheritanceLink = ' > ' + inInheritanceLink
	}
	inInheritanceLink = '<a href="'+inTitle+'.html">' + inTitle + '</a> ' + inInheritanceLink; 
	var inEntity=getEntityByTitle(inTitle);
	var definitions = inEntity.definitions[inTitle];
	if (definitions){
		if (definitions.allOf) {
			for( var i=0;i<definitions.allOf.length;i++) {
				var entityName = definitions.allOf[i]['$ref'].split('#')[1];
				inInheritanceLink =  getInheritanceLinks(entityName, inInheritanceLink) ;
			}
		} 
	}
	return inInheritanceLink;
}

/***************************************************************************************
		Helper function to find an entity in the Array by Title
***************************************************************************************/
function getEntityByTitle(inTitle){

	//find entity in schemaArray with this title
	var outputEntity;
	for(i=0;i<schemaArray.length;i++) {
		if (schemaArray[i].title==inTitle) {
			outputEntity=schemaArray[i];
		}
	}
	return outputEntity;
}


/***************************************************************************************
        Helper function to build the property table 
***************************************************************************************/
function getPropertyTable(inTitle, isInherited){

	var inEntity=getEntityByTitle(inTitle);
	var definitions = inEntity.definitions[inTitle];
	var outPropertyTable=''
	if (isInherited) {
		outPropertyTable = '<p><br />Inherited properties of ';
	} else {
		outPropertyTable = '<p><br />Properties of ';
	}
	
	if (definitions){
		//warn if there are no properties
		if ((definitions.properties) && (Object.keys(definitions.properties).length==0)) {
			console.log("WARNING: No properties for "+ inTitle);
			outPropertyTable= outPropertyTable + inTitle + '</p><p><div class="well">No properties defined</div></p>';
		} else {
			outPropertyTable= outPropertyTable + inTitle + '</p><p><table class="table table-striped table-bordered"><tr><th>Property</th><th>Type</th><th>Description</th></tr>';
			
			for(var key in definitions.properties){
				//warn if there is no description
				if (!definitions.properties[key].description){
					console.log("WARNING: No description for property "+ key);
				}
				var description = '';
				if (definitions.properties[key]['$comment:description']){   //there was a Proposed amendment to the description
					console.log('Proposed description present');
					description = '<div class="tmftext">' + definitions.properties[key]['$comment:description'] + '</div><div class="vodafonetext">' + definitions.properties[key]['description'] + '</div>';
				}	
				else {
					description = definitions.properties[key]['description'];
				}			

				//default class to be applied to property 
				var defaultClass = '';
				if (definitions.properties[key]['$comment:new']) {
					defaultClass=' class="vodafonetext" ';
				}

				if (definitions.properties[key].type){
					if ((definitions.properties[key].type=='string') || (definitions.properties[key].type=='date')|| (definitions.properties[key].type=='boolean') || (definitions.properties[key].type=='number') || (definitions.properties[key].type=='integer')) {
						type=definitions.properties[key].type;
						} else if (definitions.properties[key].type=='array') {
							if (definitions.properties[key].items['$ref']) {
								var reference=definitions.properties[key].items['$ref'].split('#').pop();
								type='array of <A href="' + reference + '.html">' + reference + '</A>';
							}
							else {
								type='array';
							}
						} else {
							type='<A href="' + definitions.properties[key].type + '.html">' + definitions.properties[key].type + '</A>';
						}
					if (definitions.properties[key]['$comment:type']){
						console.log('Proposed type present');
						type = '<div class="tmftext">' + definitions.properties[key]['$comment:type'] + '</div><div class="vodafonetext">' + type + '</div>';
					}
					outPropertyTable=outPropertyTable+'<tr><td ' + defaultClass + '>' + key + '</td><td>' + type + '</td><td>' + description + '</td></tr>';
				}
				else if (definitions.properties[key]['$ref']) {
					var reference=definitions.properties[key]['$ref'].split('#').pop();
					if (definitions.properties[key]['$comment:type']){
						console.log('Proposed type present');
						reference = '<div class="tmftext">' + definitions.properties[key]['$comment:type'] + '</div><div class="vodafonetext">' + '<a class="vodafonetext" href="' + reference + '.html">' + reference + '</a>' + '</div>';
					} else {
						reference = '<a href="' + reference + '.html">' + reference + '</a>';
					}
					
					outPropertyTable=outPropertyTable+'<tr><td ' + defaultClass + '>' + key + '</td><td>' + reference + '</td><td>' + description + '</td></tr>';
				}
				else {
					outPropertyTable=outPropertyTable+'<tr><td ' + defaultClass + '>' + key + '</td><td>' + definitions.properties[key].type +  '</td><td>' + description + '</td></tr>';
				}
			}
			outPropertyTable=outPropertyTable+'</table></p>';
		}

		if (definitions.allOf) {
			for( var i=0;i<definitions.allOf.length;i++) {
				var entityName = definitions.allOf[i]['$ref'].split('#')[1];
				outPropertyTable = outPropertyTable + getPropertyTable(entityName, true); 
			}
		} 
	}
	return outPropertyTable;
}


/***************************************************************************************
        Helper function to build the removed property table (does not show any inherited properties)
***************************************************************************************/
function getRemovedPropertyTable(inTitle){

	var inEntity=getEntityByTitle(inTitle);
	var definitions = inEntity.definitions[inTitle];
	
	if (definitions && definitions['$comment:removedProperties']) {
		var outPropertyTable='<div class="tmftext"><p><br />Properties from TM Forum removed in Proposed definition of ' + inTitle + '</p><p><table class="table table-striped table-bordered"><tr><th>Removed Property</th><th>Type</th><th>Description</th></tr>';		
		for(var key in definitions['$comment:removedProperties']){
			//warn if there is no description
			if (!definitions['$comment:removedProperties'][key].description){
				console.log("WARNING: No description for property "+ key);
			}

			var description = '';
			if (definitions['$comment:removedProperties'][key]['$comment:description']){   //there was a Proposed amendment to the description
				console.log('Proposed description present');
				description = '<div class="tmftext">' + definitions['$comment:removedProperties'][key]['$comment:description'] + '</div><div class="vodafonetext">' + definitions['$comment:removedProperties'][key]['description'] + '</div>';
			}	
			else {
				description = definitions['$comment:removedProperties'][key]['description'];
			}			

			//default class to be applied to property 
			var defaultClass = '';
			if (definitions['$comment:removedProperties'][key]['$comment:new']) {
				defaultClass=' class="vodafonetext" ';
			}

			if (definitions['$comment:removedProperties'][key].type){
				if ((definitions['$comment:removedProperties'][key].type=='string') || (definitions['$comment:removedProperties'][key].type=='date')|| (definitions['$comment:removedProperties'][key].type=='boolean') || (definitions['$comment:removedProperties'][key].type=='number') || (definitions['$comment:removedProperties'][key].type=='integer')) {
					type=definitions['$comment:removedProperties'][key].type;
					} else if (definitions['$comment:removedProperties'][key].type=='array') {
						if (definitions['$comment:removedProperties'][key].items['$ref']) {
							var reference=definitions['$comment:removedProperties'][key].items['$ref'].split('#').pop();
							type='array of <A href="' + reference + '.html">' + reference + '</A>';
						}
						else {
							type='array';
						}
					} else {
						type='<A href="' + definitions['$comment:removedProperties'][key].type + '.html">' + definitions['$comment:removedProperties'][key].type + '</A>';
					}
				if (definitions['$comment:removedProperties'][key]['$comment:type']){
					console.log('Proposed type present');
					type = '<div class="tmftext">' + definitions['$comment:removedProperties'][key]['$comment:type'] + '</div><div class="vodafonetext">' + type + '</div>';
				}
				outPropertyTable=outPropertyTable+'<tr><td ' + defaultClass + '>' + key + '</td><td>' + type + '</td><td>' + description + '</td></tr>';
			}
			else if (definitions['$comment:removedProperties'][key]['$ref']) {
				var reference=definitions['$comment:removedProperties'][key]['$ref'].split('#').pop();
				if (definitions['$comment:removedProperties'][key]['$comment:type']){
					console.log('Proposed type present');
					reference = '<div class="tmftext">' + definitions['$comment:removedProperties'][key]['$comment:type'] + '</div><div class="vodafonetext">' + '<a class="vodafonetext" href="' + reference + '.html">' + reference + '</a>' + '</div>';
				} else {
					reference = '<a href="' + reference + '.html">' + reference + '</a>';
				}
				
				outPropertyTable=outPropertyTable+'<tr><td ' + defaultClass + '>' + key + '</td><td>' + reference + '</td><td>' + description + '</td></tr>';
			}
			else {
				outPropertyTable=outPropertyTable+'<tr><td ' + defaultClass + '>' + key + '</td><td>' + definitions['$comment:removedProperties'][key].type +  '</td><td>' + description + '</td></tr>';
			}
		}
		outPropertyTable=outPropertyTable+'</table></p></div>';
		return outPropertyTable;
	} else {
		return '';
	}
}

/***************************************************************************************
        Helper function to build the instances of this entity. 
***************************************************************************************/

function getInstances(inTitle){
		
	// Show any instances of this item by searching through all of the 'allOf' entries
	var instancesObject={};

	for(var i=0;i<schemaArray.length;i++) {
		if (!schemaArray[i].definitions[schemaArray[i].title]){
			console.warn("WARNING: Cant find Entity with title " + schemaArray[i].title);
		} else {
			if (schemaArray[i].definitions[schemaArray[i].title].allOf) {
				var allOfTitle = schemaArray[i].definitions[schemaArray[i].title].allOf[0]['$ref'].split('#')[1];
				if (allOfTitle==inTitle) {
					instancesObject[schemaArray[i].title]=schemaArray[i].title;
				}
			}
		}
	}	

	returnString='';

	if (Object.keys(instancesObject).length>0){
		returnString = 'More specific types derived from ' + inTitle + ': <br /><br /><ul>';
		Object.keys(instancesObject)
		.sort()
		.forEach(function(v, i) {
			returnString = returnString + '<li><a href="' + v + '.html">' + v + '</a> </li>';
		 });
		returnString = returnString + '</ul>';
	}
	return returnString;
}


/***************************************************************************************
        Helper function to build the entities that refer to this. 
***************************************************************************************/

function getReferrers(inTitle){
		
	// Show any instances of this item by searching for '$ref' entries in all of the objects
	var referrersObject={};

	for(var i=0;i<schemaArray.length;i++) {
		var entityDefinition = schemaArray[i].definitions[schemaArray[i].title];
		if (entityDefinition) {
			for (propertyKey in entityDefinition.properties)
			{
				var propertyObj = entityDefinition.properties[propertyKey];
				if (propertyObj['$ref']){
					var refTitle = propertyObj['$ref'].split('#')[1];
					if (refTitle==inTitle) {
						referrersObject[schemaArray[i].title]=schemaArray[i].title;
					}			
				}
				if (propertyObj['items']) {
					if (propertyObj['items']['$ref']) {
						var refTitle = propertyObj['items']['$ref'].split('#')[1];
						if (refTitle==inTitle) {
							referrersObject[schemaArray[i].title]=schemaArray[i].title;
						}			
					}				
				}
			}	
		}
	}	

	returnString='';
	if (Object.keys(referrersObject).length>0){
		returnString = '<p> <br />Entities that have a reference to ' + inTitle + ': <br /></p><ul>'
		for (var referrerKey in referrersObject){
			returnString = returnString + '<li><a href="' + referrerKey + '.html">' + referrerKey + '</a> </li>';
		}
		returnString = returnString + '</ul>';
	}
	return returnString;
}

module.exports = HTMLGenerator;
