const express = require("express")
const app = express()
const csv = require('csv')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs')
const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const path = require('path');
const { resolve } = require('path');
const { readdir } = require('fs').promises;
const versionInfo = require('./version.json');


/*-- Dump environment variables ----------------------------------------------*/

console.log(process.env);

/*-- Config ------------------------------------------------------------------*/

// Config ( https://codeburst.io/node-js-best-practices-smarter-ways-to-manage-config-files-and-variables-893eef56cbef )

// const ENVIRONMENT = "development";
const ENVIRONMENT = process.env.NODE_ENV || 'development';

const defaultConfig = {
    "appDirectory": __dirname
};

const config = require('./config.json');
const environmentConfig = config[ENVIRONMENT];
const finalConfig = _.merge(defaultConfig, environmentConfig);
finalConfig['dataRootDir'] = finalConfig.dataDir;
finalConfig['dataDir'] = finalConfig.dataRootDir + "/data";
finalConfig['fileDir'] = finalConfig.dataRootDir + "/files";
finalConfig['trashDir'] = finalConfig.dataRootDir + "/trash";
finalConfig['version'] = versionInfo.version;
global.gConfig = finalConfig;

console.log(JSON.stringify(global.gConfig, null, 2));

/*-- Middleware --------------------------------------------------------------*/

app.use(express.static(global.gConfig.appDirectory + '/public'));
app.use(express.urlencoded());
app.use(express.json());

/*-- Server: Index -----------------------------------------------------------*/

// Home page
app.get("/", async function(req, res) {
    let html = await homePage();
    res.send(html);
})

/*-- Server: Template --------------------------------------------------------*/

// CREATE: Template
app.post("/api/template", async function(req, res) {
    let name = req.body.name;
    let icon = req.body.icon;
    let description = req.body.description;
    let fields = req.body.fields;
    let html = await createTemplate(name, icon, description, fields);
    res.send(html);
})

// FORM: Show template
app.get("/template/:typeId", async function(req, res) {
    let typeId = req.params.typeId;
    let html = await displayTemplate(typeId);
    res.send(html);
})

// FORM: Templates list
app.get("/templates", async function(req, res) {
    let html = await templateListHtml();
    res.send(html);
})

// FORM: Template delete confirm
app.get("/template/:typeId/delete/confirm", async function(req, res) {
    let typeId = req.params.typeId;
    let html = await templateDeleteConfirm(typeId);
    res.send(html);
})

// FORM: Template delete
app.get("/template/:typeId/delete", async function(req, res) {
    let typeId = req.params.typeId;
    let html = await templateDeleteForm(typeId);
    res.send(html);
})

/*-- Server: Item ------------------------------------------------------------*/

// CREATE: Item
app.post("/api/item/:typeId", async function(req, res) {
    let typeId = req.params.typeId;
    let parameters = req.body;
    let html = await createItem(typeId, parameters);
    res.send(html);
})

// DELETE: Item delete confirm
app.get("/item/:itemId/delete/confirm", async function(req, res) {
    let itemId = req.params.itemId;
    let html = await itemDeleteConfirm(itemId);
    res.send(html);
})

// FORM: Item delete
app.get("/item/:itemId/delete", async function(req, res) {
    let itemId = req.params.itemId;
    let html = await itemDelete(itemId);
    res.send(html);
})

// FORM: Add item
app.get("/item/add/:typeId", async function(req, res) {
    let typeId = req.params.typeId;
    let html = await addItemForm(typeId);
    res.send(html);
})

/*-- Server: Table -----------------------------------------------------------*/

// FORM: Table
app.get("/table/:typeId", async function(req, res) {
    let typeId = req.params.typeId;
    let html = await tableHtml(typeId);
    res.send(html);
})

// FORM: Tables list (just shows template page for now)
app.get("/tables", async function(req, res) {
    let html = await templateListHtml();
    res.send(html);
})

/*-- Server: Tree ------------------------------------------------------------*/

// FORM: Tree
app.get("/tree", async function(req, res) {
    let html = await buildHtmlResponse();
    res.send(html);
})

/*-- Server: Tree ------------------------------------------------------------*/

// FORM: Trash
app.get("/trash", async function(req, res) {
    let html = await showTrash();
    res.send(html);
})

/*-- Server: About -----------------------------------------------------------*/

// FORM: About
app.get("/about", async function(req, res) {
    let html = showAbout();
    res.send(html);
})

/*-- Server: Listen ----------------------------------------------------------*/

app.listen(global.gConfig.port, () => {
    console.log("")
    console.log(`The 'kanecta-server-service-unified' microservice is being served at: http://localhost:${global.gConfig.port}`);
    console.log("")
});

/*-- Functions: HTTP generation ----------------------------------------------*/

function topMenuHtml() { 
    
    let html = new Html(1);

    html.add(`<header class="header">`);
    html.add(`    <ul class="header__menu">`);
    html.add(`        <li><a href="/">Home</a></li>`);
    html.add(`        <li><a href="/tree">Tree</a></li>`);
    html.add(`        <li><a href="/tables">Tables</a></li>`);
    html.add(`        <li><a href="/templates">Templates</a></li>`);
    html.add(`        <li><a href="/trash">Trash</a></li>`);
    html.add(`        <li><a href="/about">About</a></li>`);
    html.add(`    </ul>`);
    html.add(`    <hr>`);
    html.add(`<header>`);

    return html.fetch();
}

function standardHeadersHtml() {    
    return `<link rel="stylesheet" type="text/css" href="/css/kanecta.css" >`;
}

function showAbout() {

    let html = new Html();

    html.add(`<html>`);
    html.add(`    <head>`);
    html.add(`        ${standardHeadersHtml()}`);
    html.add(`    </head>`);
    html.add(`    <body>`);
    html.add(`        ${topMenuHtml()}`);
    html.add(`        <main>`);
    html.add(`            <h1>About</h1>`);
    html.add(`            <ul>`);
    html.add(`                <li>`);
    html.add(`                    <label><b>Version:</b></label>&nbsp;<span>${global.gConfig.version}</span>`);
    html.add(`                </li>`);
    html.add(`            <ul>`);
    html.add(`        </main>`);
    html.add(`    </body>`);
    html.add(`</html>`);
    
    return html.fetch();
}

async function homePage() {
    return `
        <html>
            <head>
                ${standardHeadersHtml()}
            </head>
            <body>
                ${topMenuHtml()}
                <main>
                    <h1>Kanecta</h1>
                   <ul>
                        <li>
                            <a href="/tree">Tree</a>
                        </li>
                        <li>
                            <a href="/templates">Templates</a>
                        </li>
                    </ul>
                </main>
            </body>
        </html>
    `;
}

async function itemDeleteConfirm(itemId) {
    return `
        <html>
            <body>
                <p>Are you sure you want to delete item <b>${itemId}</b></p>
                <a href="/item/${itemId}/delete">Confirm</a>&nbsp;&nbsp;<a href="/templates">Cancel</a>
            </body>
        </html>
    `;
}

async function fileContentToString(file) {
    return fs.readFileSync(file, "utf8");
}

async function writeStringToFile(file, content) {
    fs.writeFileSync(file, content);
}

async function writeJsonToDisk(file, obj) {
    let objString = JSON.stringify(obj, null, 2);
    let fileDir = path.dirname(file);
    fs.mkdirSync(fileDir, { recursive: true });
    fs.writeFileSync(file, objString);
}

async function showTrash() {
    
    let trashDir = global.gConfig.trashDir;

    let trashDirExists = fs.existsSync(trashDir);
    
    let templates = null;
    let items = null;

    let trashTemplatesFile = `${trashDir}/templates.txt`;
    console.log(trashTemplatesFile)
    if (fs.existsSync(trashTemplatesFile)) {
        templates = await fileContentToString(trashTemplatesFile);
    }

    let trashItemsFile = `${trashDir}/items.txt`;
    if (fs.existsSync(trashItemsFile)) {
        items = await fileContentToString(trashItemsFile);
    }

    let html = "";

    html += "<html>";
    html += `   <head>\n`;
    html += `       ${standardHeadersHtml()}\n`;
    html += `   </head>\n`;
    html += `   <body>\n`;
    html += `       ${topMenuHtml()}\n`;
    html += "       <main>";
    html += "        <h1>Trash</h1>";

    if (trashDirExists) {

        html += "        <h2>Templates</h2>";

        if (templates) {
            html += `        <code><pre>${templates}</pre></code>`;
        } else {
            html += `        <p>No templates</p>`;
        }

        html += "        <h2>Items</h2>";
        
        if (items) {
            html += `        <code><pre>${items}</pre></code>`;
        } else {
            html += `        <p>No templates</p>`;
        }

    } else {
        html += "        <p>Nothing in trash</p>";
    }

    html += "       </main>";
    html += "    </body>";
    html += "</html>";

    return html;
}

async function itemDelete(itemId) {
    
    let item = await getItemFromDisk(itemId);
    let typeId = item.typeId;

    // Delete from CSV
    let csvFilePath = fileNameFromUuid(typeId, "table", "csv");
    let content = await fileContentToString(csvFilePath);
    console.log("BEFORE: ", content);
    let adjustedLine = null;
    let lines = [];
    for (let line of content.split('\n')) {
        let segments = line.split(',');
        let id = null;
        if (segments.length > 0 && segments[0]) {
            id = segments[0].substr(1,segments[0].length - 2);            
        }
        if (id && id == itemId) {
            let a = line.indexOf(',');
            let b = line.indexOf(',', a + 1);
            let lineEnd = line.substr(b, line.length);
            let lineStart = `"${itemId}","true"`;
            adjustedLine = lineStart + lineEnd;
            lines.push(lineStart + lineEnd);
        } else {
            lines.push(line);
        }
    }
    let newContent = lines.join('\n');
    console.log("AFTER: ", newContent);
    await writeStringToFile(csvFilePath, newContent);

    // Delete JSON file (don't actually delete, mark as deleted)
    let jsonFileName = fileNameFromUuid(itemId, "item", "json");
    item['deleted'] = true;
    await writeJsonToDisk(jsonFileName, item);

    await addToTrash("items", itemId);

    return `
        <html>
            <body>
                <h1>Deleted item</h1>
                <h2>Item ID</h2>
                <code><pre>${itemId}</pre></code>
                <h2>Files</h2>
                <code><pre>${csvFilePath}\n${jsonFileName}</pre></code>
                <h2>CSV change</h2>
                <code><pre>${adjustedLine}</pre></code>
                <a href="/table/${typeId}">Back</a>
            </body>
        </html>
    `;
}

async function getItemFromDisk(itemId) {
    let itemFilePath = fileNameFromUuid(itemId, "item", "json");
    return getJsonFileFromDisk(itemFilePath);
}

async function getTemplateFromDisk(typeId) {
    let templateFilePath = fileNameFromUuid(typeId, "template", "json");
    return getJsonFileFromDisk(templateFilePath);
}

async function getJsonFileFromDisk(file) {
    let rawdata = fs.readFileSync(file);
    let obj = JSON.parse(rawdata);
    return obj;
}

async function addToTrash(type, id) {
    let trashDir = global.gConfig.trashDir;
    let trashFilePath = `${trashDir}/${type}.txt`;
    let content = "";
    if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true });
    } else {
        if (fs.existsSync(trashFilePath)) {
            content = await fileContentToString(trashFilePath);
        }
    }   
    console.log("ADDING TO TRASH: ", type, id, trashFilePath);    
    content += id + "\n";
    await writeStringToFile(trashFilePath, content);
}

async function templateDeleteForm(typeId) {
    let file = fileNameFromUuid(typeId, "template", "json");
    let template = await getTemplateFromDisk(typeId);
    console.log("Deleting template: ", file);
    template['deleted'] = true;
    await writeJsonToDisk(file, template);
    await addToTrash("templates", typeId);
    return `
        <html>
            <body>
                <p>Deleted template <b>${typeId}</b></p>
                <a href="/templates">Back</a>
            </body>
        </html>
    `;
}

async function displayTemplate(typeId) {

    let template = await getTemplate(typeId);
    return `
        <html>
            <body>
                ${topMenuHtml()}
                <h1>Template</h1>
                <code><pre>${JSON.stringify(template, null, 2)}</pre></code>
                <a href="/templates">Back</a>
            </body>
        </html>
    `;
}

async function templateDeleteConfirm(typeId) {
    return `
        <html>
            <body>
                <p>Are you sure you want to delete template <b>${typeId}</b></p>
                <a href="/template/${typeId}/delete">Confirm</a>&nbsp;&nbsp;<a href="/templates">Cancel</a>
            </body>
        </html>
    `;
}

/*-- Functions: Generic ------------------------------------------------------*/

async function getTemplates() {
    let templates = [];
    let files = await getFiles(global.gConfig.dataDir);
    for (let file of files) {
        let fileName = path.basename(file);
        if (fileName.startsWith("template") && fileName.endsWith(".json")) {
            let rawdata = fs.readFileSync(file);
            let student = JSON.parse(rawdata);
            templates.push(student);
        }
    }
    return templates;
}

async function getTemplate(typeId) {
    let file = fileNameFromUuid(typeId, "template", "json");
    let rawdata = fs.readFileSync(file);
    return JSON.parse(rawdata);
}

async function addItemForm(typeId) {

    let template = await getType(typeId);

    var html = "";

    html += `<html>\n`;
    html += `   <body>\n`;
    html += `       ${topMenuHtml()}\n`;
    html += `       <h1>Add Item: ${template.name}</h1>\n`;
    html += `       <a href="/table/${typeId}">Back</a><br><br>\n`;
    html += `       <form method="post" action="/api/item/${template.typeId}">\n`;
    html += `           <ul>\n`;

    for (let field of template.fields) {

        html += `               <li>\n`;
        html += `                   <label for="${field.key}">${field.name}</label>\n`;
        html += `                   <input name="${field.key}" type="text">\n`;
        html += `               </li>\n`;

    }

    html += `           </ul>\n`;
    html += `           <input type="submit" value="Create item">\n`;
    html += `       </form>\n`;    
    html += `   </body>\n`;
    html += `</html>\n`;

    return html;
}

async function createItem(typeId, parameters) {

    return new Promise(async (resolve, reject) => {

        let template = await getType(typeId);
        let fieldNames = template.fields.map( field => field.key);

        let fieldIdMap = [];
        for (let field of template.fields) {
            fieldIdMap[field.key] = field.fieldId;            
        }

        console.log("CREATE ITEM")

        let uuid = uuidv4();        

        // Add to JSON
        let item = {
            version: "1",
            itemId: uuid,
            typeId: typeId,    
            fields: []
        };
        for (let fieldName of fieldNames) {
            if (parameters) {
                if (parameters.hasOwnProperty(fieldName)) {
                    item.fields.push({
                        fieldId: fieldIdMap[fieldName],
                        key: fieldName,
                        value: parameters[fieldName]
                    });
                }
            }
        }
        let jsonPath = pathFromUuid(uuid);
        let jsonFile = fileNameFromUuid(uuid, "item", "json");
        console.log("JSON file: ", jsonFile);
        let itemString = JSON.stringify(item, null, 2);
        console.log(itemString);
        fs.mkdirSync(jsonPath, { recursive: true });
        fs.writeFileSync(jsonFile, itemString);

        // Add to CSV table
        
        // Template fields
        
        fieldNames.unshift("deleted");
        fieldNames.unshift("itemId");
        let csvHeaders = '"' + fieldNames.join('","') + '"';
        
        let fileDir = pathFromUuid(typeId);
        let file = fileNameFromUuid(typeId, "table", "csv");
            
        let csvData = { itemId: uuid, deleted: false };
        for (let fieldName of fieldNames) {
            if (parameters) {
                if (parameters.hasOwnProperty(fieldName)) {
                    csvData[fieldName] = parameters[fieldName];
                }
            }
        }
        console.log(csvData)
        
        console.log("file: ", file);
        fs.mkdirSync(fileDir, { recursive: true });
        try {
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, csvHeaders + "\n");
            }
        } catch(err) {
            console.log(err);
        }

        const csvWriter = createCsvWriter({
            path: file,
            fieldDelimiter: ',',
            recordDelimiter: '\n',
            alwaysQuote: true,
            encoding: 'utf8',
            append: true,
            header: fieldNames
        });
        
        const records = [ csvData ];
        
        csvWriter.writeRecords(records).then(() => {
            console.log('...Done');
            resolve(`
                <html>
                    <body>
                        ${topMenuHtml()}
                        <h1>Item created</h1>
                        <h2>File</h2>
                        <code><pre>${file}</pre></code>
                        <h2>Data</h2>
                        <a href="/table/${typeId}">Back</a>
                    </body>
                </html>
            `);
        });
    });
}

async function templateListHtml() {

    let hasTemplates = fs.existsSync(global.gConfig.dataDir);

    var html = "";

    html += `<html>\n`;
    html += `   <head>\n`;
    html += `       ${standardHeadersHtml()}\n`;
    html += `       <style>\n`;
    html += `           table {\n`;
    html += `               border-collapse: collapse;\n`;
    html += `           }\n`;
    html += `           td {\n`;
    html += `               border: 1px solid black;\n`;
    html += `               padding: 10px;\n`;
    html += `           }\n`;
    html += `       </style>\n`;
    html += `   </head>\n`;
    html += `   <body>\n`;
    html += `       ${topMenuHtml()}\n`;
    html += `       <main>\n`;    
    html += `       <h1>Templates</h1>\n`;
    html += `       <a href="/create-template.html">Create new template</a><br><br>\n`;

    if (hasTemplates) {

        let templates = await getTemplates();

        console.log(templates);

        templates = templates.filter(template => !template.hasOwnProperty('deleted') || (template.hasOwnProperty('deleted') && template.deleted == false) );

        html += `       <table>\n`;

        for(let template of templates) {
            html += `           <tr>\n`;
            html += `               <td>\n`;
            html += `                   ${template.name}\n`;
            html += `               </td>\n`;
            html += `               <td>\n`;
            html += `                   ${template.typeId}\n`;
            html += `               </td>\n`;
            html += `               <td>\n`;
            html += `                   <a href="/table/${template.typeId}">Items</a>\n`;
            html += `                   <a href="/template/${template.typeId}">View</a>\n`;
            html += `                   <a href="/template/${template.typeId}/delete/confirm">Delete</a>\n`;
            html += `               </td>\n`;
            html += `           </tr>\n`;
        }
        
        html += `       </table>\n`;

    } else {        
        html += `       <p>No templates</p>\n`;
    }

    html += `       </main>\n`;
    html += `   </body>\n`;
    html += `</html>\n`;

    return html;
}

async function createTemplate(name, icon, description, fields) {
    console.log("CREATE TEMPLATE")
    let uuid = uuidv4();    
    let fileDir = pathFromUuid(uuid);
    let file = fileNameFromUuid(uuid, "template", "json");
    console.log("file: ", file);
    let template = {
        version: "1",
        typeId: uuid,
        key: createKey(name),
        name: name,
        icon: icon,
        description: description,
        fields: []
    };
    for(let field of fields) {
        if (field.name) {
            template.fields.push({
                fieldId: uuidv4(),
                type: field.type,
                key: createKey(field.name),
                name: field.name
            });
        }
    }
    let templateString = JSON.stringify(template, null, 2);
    console.log(templateString);
    fs.mkdirSync(fileDir, { recursive: true });
    fs.writeFileSync(file, templateString);
    return `
        <html>
            <body>
                <a href="/templates">Back</a>
                <h1>SUCCESS</h1>
                <h2>File</h2>
                <code><pre>${file}</pre></code>
                <h2>Data</h2>
                <code><pre>${templateString}</pre></code>
            </body>
        </html>
    `;
}

async function getItems(typeId) {
    let fileName = fileNameFromUuid(typeId, "table", "csv")
    try {
        return await readCSV(fileName);
    } catch (e) {
        return [];
    }
}

async function tableHtml(typeId) {

    let type = await getType(typeId);
    let items = await getItems(typeId);

    console.log(items)

    items = items.filter(item => item.length > 1 && (item[1] == "false" | item[1] == "deleted") );

    console.log(items)
    
    var html = "";

    html += `<html>\n`;
    html += `   <head>\n`;
    html += `       ${standardHeadersHtml()}\n`;
    html += `       <style>\n`;
    html += `           table {\n`;
    html += `               border-collapse: collapse;\n`;
    html += `           }\n`;
    html += `           td,th {\n`;
    html += `               border: 1px solid black;\n`;
    html += `               padding: 10px;\n`;
    html += `           }\n`;
    html += `       </style>\n`;
    html += `   </head>\n`;
    html += `   <body>\n`;
    html += `       ${topMenuHtml()}\n`;
    html += `       <main>\n`;    
    html += `       <h1>Table: ${type.name}</h1>\n`;
    html += `       <span>Type ID: ${type.typeId}</span><br><br>\n`;
    html += `       <a href="/item/add/${typeId}">Add item</a><br><br>\n`;

    if (items.length < 2) {
        html += "<p>No data</p>";
    } else {
        html += `       <table>\n`;
        html += `           <tr>\n`;
    
        // Headings
        let headingsMap = [];
        let i = 0;
        for(let field of type.fields) {        
            headingsMap[field.key] = i++;
            html += `               <th>\n`;
            html += `                   ${field.name}\n`;
            html += `               </th>\n`;        
        }
        headingsMap["itemId"] = type.fields.length;
        
        // console.log(headingsMap);
    
        html += `               <th>\n`;
        html += `                   Item ID\n`;
        html += `               </th>\n`;        
        html += `               <th>\n`;
        html += `                   &nbsp;\n`;
        html += `               </th>\n`;
        html += `           </tr>\n`;
    
        // Data
        let firstRow = true;
        let dataMap = [];
        let k = 0;
        let itemId = null;
        for(let item of items) {
    
            // Data rows
            if (!firstRow) {
    
                let cells = [];
                for (var n = 0; n < type.fields; n++ ) {
                    cells.push(null);
                }
    
                html += `           <tr>\n`;
                
                for (let i = 0; i < item.length; i++) {
                    let columnValue = item[i];
                    let y = dataMap[i];
                    let x = headingsMap[y];
                    if (dataMap[i] == 'itemId') {
                        itemId = columnValue;
                    }
                    cells[x]= columnValue;
                }
    
                for (let cell of cells) {
                    html += `               <td>\n`;
                    html += `                   ${cell}\n`;
                    html += `               </td>\n`;
                }

                html += `               <td>\n`;
                html += `                   <a href="/">View</a>&nbsp;<a href="/item/${itemId}/delete/confirm">Delete</a>\n`;
                html += `               </td>\n`;
    
                html += `           </tr>\n`;

                itemId = null;
    
            // Check heading order
            } else {
                firstRow = false;
                for(let column of item) {
                    dataMap[k++] = column;                
                }
                // console.log(dataMap)
            }
        }
        html += `       </table>\n`;
    }
    
    html += `       </main>\n`;
    html += `   </body>\n`;
    html += `</html>\n`;

    return html;
}

async function buildHtmlResponse() {

    let initialChunkFile = fileNameFromUuid(global.gConfig.initialChunkId, "chunk", "csv");
    let initialChunkExists = fs.existsSync(initialChunkFile);

    if (!initialChunkExists) {

        let html = new Html(1);

        html.add(`<html>`);
        html.add(`    <head>`);
        html.add(`        ${standardHeadersHtml()}`);
        html.add(`    </head>`);
        html.add(`    <body>`);
        html.add(`        ${topMenuHtml()}`);
        html.add(`        <main>`);
        html.add(`            <h1>Tree</h1>`);
        html.add(`            <p>No tree exists</p>`);
        html.add(`        </main>`);
        html.add(`    </body>`);
        html.add(`</html>`);

        return html.fetch();

    } else {
        let chunkRecords = await getChunkRecords();
        let expandedRecords = await expandItems(chunkRecords);
        let html = await generateHtml(expandedRecords);
        return html;    
    }
}

async function getChunkRecords() {
      
    // https://www.npmjs.com/package/csv-parser
    // https://stackoverflow.com/questions/47035889/javascript-node-read-from-csv-file-and-store-data-into-object
    // https://www.npmjs.com/package/csv-parser
    // https://github.com/adaltas/node-csv-parse/issues/139

    return new Promise((resolve, reject) => {

        var csvData = [];

        let chunkPath = fileNameFromUuid(global.gConfig.initialChunkId, "chunk", "csv");

        console.log("Reading initial chunk from", chunkPath);
        
        var readStream = fs.createReadStream(chunkPath);

        //https://csv.js.org/parse/options/#available-options
        var parser = csv.parse({ 
            newline: '\n', 
            quote: '"', 
            escape: '"',
            delimiter: ',', 
            from: 1,
            ltrim: true, 
            rtrim: true
        });

        parser.on('readable', function() {
            while(record = parser.read()) {
                csvData.push(record);
            }
        });

        parser.on('headers', (headers) => {
            console.log(`First header: ${headers[0]}`);
        });

        parser.on('error', function(err) {
            console.log(err.message);
        });

        parser.on('finish', (function() {
            resolve(csvRecordsToItems(csvData));
        }));

        readStream.pipe(parser);
    });
}

async function readCSV(file) {
      
    // https://www.npmjs.com/package/csv-parser
    // https://stackoverflow.com/questions/47035889/javascript-node-read-from-csv-file-and-store-data-into-object
    // https://www.npmjs.com/package/csv-parser
    // https://github.com/adaltas/node-csv-parse/issues/139

    return new Promise((resolve, reject) => {

        var csvData = [];

        console.log("Reading CSV", file);
        
        var readStream = fs.createReadStream(file);
        
        readStream.on('error', function (error) {
            reject(error);
        });

        //https://csv.js.org/parse/options/#available-options
        var parser = csv.parse({ 
            newline: '\n', 
            quote: '"', 
            escape: '"',
            delimiter: ',', 
            from: 1,
            ltrim: true, 
            rtrim: true
        });

        parser.on('readable', function() {
            while(record = parser.read()) {
                csvData.push(record);
            }
        });

        parser.on('headers', (headers) => {
            console.log(`First header: ${headers[0]}`);
        });

        parser.on('error', function(err) {
            reject(err.message);
        });

        parser.on('finish', (function() {
            resolve(csvData);
        }));

        readStream.pipe(parser);
    });
}

function pathFromUuid(hyphenatedUuid) {
    // console.log(uuid);
    uuid = hyphenatedUuid.replace(/-/g, '');
    return global.gConfig.dataDir + "/"
        + uuid.substring(0,1) + "/"
        + uuid.substring(1,2) + "/"
        + uuid.substring(2,3)
}

function fileNameFromUuid(hyphenatedUuid, prefix, suffix) {
    return pathFromUuid(hyphenatedUuid) + `/${prefix}-${hyphenatedUuid}.${suffix}`;        
}

async function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) {
                return reject(err);
            }
            resolve(data);
        }); 
    });
}

function createKey(text) {
    return text.replace(/\s+/g, '-').toLowerCase();
}

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function getType(typeId) {
    let path = fileNameFromUuid(typeId, "template", "json");
    let jsonString = await readJsonFile(path);
    // console.log(jsonString)
    let object = JSON.parse(jsonString)
    return object;
}

async function expandObject(item) {
    
    // console.log(item)
    let objectItems = [];    
    let type = await getType(item.typeId);
    // console.log(type);

    // Object name
    let baseLevel = Number(item.level);
    objectItems.push({
        "level": item.level,
        "itemId": item.itemId,
        "parentId": item.parentId,
        "type": "FIXED_HEADING__OBJECT",
        "typeId": item.typeId,
        "sortOrder": item.sortOrder,
        "value": type.name
    });

    // Object field headings
    let i = 1;
    for (let field of type.fields) {
        objectItems.push({
            "level": String(baseLevel + 1),
            "itemId": item.itemId + field.fieldId,
            "parentId": item.itemId,
            "type": "FIXED_HEADING__FIELD",
            "typeId": "",
            "sortOrder": String(i),
            "value": field.name
        });

        //Object field values
        let valueObj = JSON.parse(item.value);
        let value = "";
        if (valueObj.hasOwnProperty(field.key)) {
            value = valueObj[field.key];
        }

        objectItems.push({
            "level": String(baseLevel + 2),
            "itemId": item.itemId + field.fieldId,
            "parentId": item.itemId,
            "type": "FIXED_VALUE__" + field.type,
            "typeId": "",
            "sortOrder": String(i),
            "value": value
        });
    }    
    
    // console.log(objectItems);
    return objectItems;
}

function isFixedHeading(type) {
    return type.startsWith("FIXED_HEADING__");
}

function isFixed(type) {
    return type.startsWith("FIXED_");
}

async function expandItems(items) {
    let expandedItems = [];
    for (let item of items) {
        if (item.type == "OBJECT") {
            let virtualItems = await expandObject(item);
            expandedItems.push(...virtualItems);
        } else {
            expandedItems.push(item);
        }
    }
    return expandedItems;
}

async function csvRecordsToItems(csvData) {
    let items = [];
    for (let line of csvData) {
        items.push({
            "level": line[0],
            "itemId": line[1],
            "parentId": line[2],
            "type": line[3],
            "typeId": line[4],
            "sortOrder": line[5],
            "value": line[6]
        });
    }
    return items;
}

function headingFriendlyName(key) {
    switch(key) {
        case "FIXED_HEADING__OBJECT":
            return "Object name"
        case "FIXED_HEADING__FIELD":
            return "Field name"
        case "FIXED_VALUE__TEXT":
            return "Text"
        default:
            return key;
    }
}

async function generateHtml(items) {

    var html = "";

    html += `<html>\n`;
    html += `   <head>\n`;
    html += `       ${standardHeadersHtml()}\n`;
    html += `       <style>\n`;
    html += `           .item {\n`;
    html += `               display: flex;\n`;
    html += `               flex-direction: row;\n`;
    html += `           }\n`;
    html += `           .item__text {\n`;
    html += `               flex: 1 1 auto;\n`;
    html += `           }\n`;
    html += `       </style>\n`;
    html += `   </head>\n`;
    html += `   <body>\n`;
    html += `       ${topMenuHtml()}`;
    html += `       <main>`;
    html += `       <h1>Tree</h1>\n`;
    html += `       <table>\n`;

    //Record 1
    for (let item of items) {
        html += `           <tr>\n`;
        html += `               <td>\n`;
        html += `                   <div class="item">\n`;
        html += `                       <div style="width: ${Number(item.level) * 10}px;">&nbsp;</div>\n`;
        if (isFixedHeading(item.type)) {
            html += `                       <span class="item__text">${item.value}</span>\n`;
        } else {
            html += `                       <input class="item__text" type="text" value="${item.value}"/>\n`;
        }        
        html += `                   </div>\n`;
        html += `               </td>\n`;
        html += `               <td>\n`;
        if (isFixed(item.type)) {
            html += `                       <span>${headingFriendlyName(item.type)}</span>\n`;
        } else {
            html += `                   <select id="new_record_type">\n`;
            html += `                       <option value="TEXT"${item.type == 'TEXT' ? ' selected' : ''}>Text</option>\n`;
            html += `                       <option value="NUMBER"${item.type == 'NUMBER' ? ' selected' : ''}>Number</option>\n`;
            html += `                       <option value="BOOLEAN"${item.type == 'BOOLEAN' ? ' selected' : ''}>True/False</option>\n`;
            html += `                       <option value="DATE"${item.type == 'DATE' ? ' selected' : ''}>Date</option>\n`;
            html += `                       <option value="FILE"${item.type == 'FILE' ? ' selected' : ''}>File</option>\n`;
            html += `                       <option value="OBJECT"${item.type == 'OBJECT' ? ' selected' : ''}>Object</option>\n`;
            html += `                       <option value="SQL"${item.type == 'SQL' ? ' selected' : ''}>SQL</option>\n`;
            html += `                       <option value="FUNCTION"${item.type == 'FUNCTION' ? ' selected' : ''}>Function</option>\n`;
            html += `                       <option value="WIDGET"${item.type == 'WIDGET' ? ' selected' : ''}>Widget</option>\n`;
            html += `                   </select>\n`;
        }
        html += `               </td>\n`;
        html += `               <td>\n`;
        html += `                   <button>Add</button>\n`;    
        html += `                   <button>Delete</button>\n`;
        if (!isFixedHeading(item.type)) {
            html += `                   <button>Update</button>\n`;
        } else {
            html += `                   <button>Modify template</button>\n`;
        }
        html += `               </td>\n`;
        html += `           </tr>\n`;
    }
    
    //Add
    html += `           <tr>\n`;
    html += `               <td>\n`;
    html += `                   <input type="text" id="new_record_value">\n`;
    html += `                   <select id="new_record_type">\n`;
    html += `                       <option value="TYPE__PRIMITIVE">Primitive</option>\n`;
    html += `                       <option value="TYPE__OBJECT">Object</option>\n`;
    html += `                       <option value="TYPE_SQL">SQL</option>\n`;
    html += `                       <option value="TYPE_FUNCTION">Function</option>\n`;
    html += `                   </select>\n`;
    html += `                   <button>Add</button>\n`;
    html += `               </td>\n`;
    html += `           </tr>\n`;

    html += `       </table>\n`;
    html += `       </main>`;
    html += `   </body>\n`;
    html += `</html>`;

    return html;
}

class Html {
    constructor(indent = 0) {
        this.indent = indent;
        this.html = "";
    }
    add(html) {
        this.html += ' '.repeat(this.indent * 4) + html + "\n";
    }
    fetch() {
        return this.html;
    }
}