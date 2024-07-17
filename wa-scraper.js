const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const prompt = require("prompt-sync")();
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const url = prompt("Paste WA URL:");

axios.get(url).then((response) => {
  const html = response.data;
  const $ = cheerio.load(html);
  const jsonData = [];

  $("[class*=EventResults_eventResult]").each((sectionIndex, section) => {
    const eventName = $(section).find("h2").text().trim();

    const parentDiv = $(section)
      .find("[class*=EventResults_eventMeta]")
      .parent();

    $(parentDiv).each((parentIndex, parentElement) => {
      const metadata = $(parentElement)
        .find("[class*=_eventMeta__]")
        .text()
        .trim();

      $(parentElement)
        .find("table")
        .each((tableIndex, table) => {
          $(table)
            .find("tbody tr")
            .each((rowIndex, row) => {
              const rowData = {};
              $(row)
                .find("td")
                .each((cellIndex, cell) => {
                  const cellValue = $(cell).text().trim();
                  switch (cellIndex) {
                    case 0:
                      rowData.place = cellValue;
                      break;
                    case 1:
                      const names = cellValue.split(" ", 2);
                      rowData.firstName = names[0];
                      rowData.lastName = names[1];

                      //rowData.name = cellValue;
                      break;
                    case 3:
                      rowData.nat = cellValue;
                      break;
                    case 4:
                      rowData.mark = cellValue;
                      break;
                  }
                });
              rowData.eventName = eventName.replace("Women's ","").replace("Men's ","");
              if (eventName.includes("Women")) {
                rowData.gender = "F";
              } else {
                rowData.gender = "M";
              }
              rowData.metadata = metadata;
              
              rowData.type = "E";
              jsonData.push(rowData);
            });
        });
    });
  });
  const csvWriter = createCsvWriter({
    path: "output.csv",
    header: [
      { id: "place", title: "Place" },
      { id: "firstName", title: "First Name" },
      { id: "lastName", title: "Last Name" },
      { id: "gender", title: "Gender" },
      { id: "nat", title: "Nationality" },
      { id: "mark", title: "Mark" },
      { id: "type", title: "Type" },
      { id: "eventName", title: "Event Name" },
      { id: "metadata", title: "Metadata" },
    ],
  });

  csvWriter.writeRecords(jsonData).then(() => {
    console.log("CSV file was written successfully");
  });
});
