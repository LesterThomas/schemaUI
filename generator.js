var HTMLUIGenerator = require('./HTMLUIGenerator.js');


// Generate html for TMF Schemas
HTMLUIGenerator(['../Schemas/Customer','../Schemas/Common','../Schemas/EngagedParty','../Schemas/Product','../Schemas/Resource','../Schemas/Service'],'./docs','TMFhtmlConfig.json');
