import Settings from "../interfaces/Settings";
const Genius = require("genius-api");
var Xray = require("x-ray");

var x = Xray();
let genius: any;

export function configureGenius(settings: Settings) {
  genius = new Genius(settings.geniusClientAccessToken);
}

export async function searchGenius(query: string) {
  return new Promise(async (resolve, reject) => {
    console.log("Searching for", query);
    const res = await genius.search(query);

    let url: string = res.hits.length > 0 ? res.hits[0].result.url : null;
    if (!url) throw new Error("No url returned in search.");

    let geniusId = res.hits[0].result.id;
    console.log("Scraping", url, geniusId);

    x(
      url,
      ".lyrics@html"
    )((err: any, body: any) => {
      if (err) reject(err);
      console.log("Ok.");
      resolve(body);
    });
  });
}
