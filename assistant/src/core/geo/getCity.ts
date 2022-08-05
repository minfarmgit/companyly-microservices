import { CityModel } from "./models/city.model";
import { BestMatch, findBestMatch } from 'string-similarity';
import * as fs from "fs";
import * as path from "path";

export async function getCity(request: string): Promise<CityModel> {
    const dir = __dirname.split(path.sep).join('/');
    const namesJson: string = (await fs.readFileSync( dir + '/russia/cities-names-list.json')).toString();
    const namesList: string[] = JSON.parse(namesJson);
    const citiesJson: string = (await fs.readFileSync( dir + '/russia/cities-list.json')).toString();
    const citiesList: CityModel[] = JSON.parse(citiesJson);
    const bestMatch: BestMatch = findBestMatch(request, namesList);
    const targetCity: CityModel = citiesList[bestMatch.bestMatchIndex];
    return targetCity;
}