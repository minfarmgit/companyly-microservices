import '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export class BerkeliumClassificationPredict {

    constructor() { }

    encodeData(sentence: string) {
        const sentences = sentence.toLowerCase();
        const encodedData = use.load()
            .then(model => {
                return model.embed(sentences)
                    .then(embeddings => {
                        // console.log('Encoded: ', embeddings);
                        return embeddings;
                    });
            })
            .catch(err => console.error('Fit Error:', err));
        return encodedData
    }

    predict(outputTensor: { dataSync: () => any; }, responseData: any) {
        let classified_results = outputTensor.dataSync();
        const shape = classified_results.shape;
        const classIndex = classified_results.indexOf(Math.max(...classified_results));
        const intentClass = responseData.classes[classIndex];
        const responseText = responseData.responses.find((element: any) => intentClass in element);;
        const responseIndex = Math.floor(Math.random() * responseText[intentClass].length);
        // console.log(intentClass, responseIndex, responseText, responseText[intentClass].length);
        return responseText[intentClass][responseIndex];
    }
}
