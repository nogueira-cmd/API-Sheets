const cron = require('node-cron');
const express = require("express");
const req = require("express/lib/request");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

//Importando a função -> getData

const {getData} = require('./controllers/searchData')



//Autenticação
async function getAuthSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();

  const googleSheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const spreadsheetId = "1ag89ugWlzOGId02TbYl5Y4ch4DzOk2_Uv7wwbW84Rrw";

  return {
    auth,
    client,
    googleSheets,
    spreadsheetId,
  };
}

app.get("/metadata", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const metadata = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  });

  res.send(metadata.data);
});

//Requisição -> Recebe os dados da planilha!

 app.get("/checkClient/:cpf", async (req, res) => {

  const cpf = req.params.cpf

  if(!cpf){
    return res.status(400).send({
      "find": false,
      "message": "CPF não encontrado!"
    })
  }

  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Base",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const data = getData(getRows.data,cpf)
  return res.send(data)
});

// Requisição -> Adicionar dados na planilha!

app.post("/addRow", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const { values } = req.body;

  const row = await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: "Base",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values,
    },
  });

  res.send(row.data);
});

// Requisição -> atualizar valores da planilha!

app.post("/updateValue", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const { values } = req.body;

  const updateValue = await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Base!A2:C2",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values,
    },
  });

  res.send(updateValue.data);
});


app.listen(3001, () => console.log("Rodando na porta 3001"));




