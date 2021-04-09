let fs = require('fs');
let natural = require('natural');
let csv = require('csvtojson');
const { checkServerIdentity } = require('tls');

let classifier = new natural.LogisticRegressionClassifier();

let datasetFile = "./spam-training.csv"
let trainingFile = "./spam-training.json"

let validationFileCSV = "./spam-validation.csv"
let validationFileJSON = "./spam-validation.json"

let modelFile = "./model.json"

//Import Function
function convertCsvToJson(csvFile=datasetFile, jsonFile=trainingFile) {
    console.log("Importing CSV to JSON...");

    fs.writeFileSync(jsonFile, "[");
    var jsonArray = csv().fromFile(csvFile).subscribe((json, lineNumber) => {
        if (lineNumber > 0)
            fs.appendFileSync(jsonFile, ",\n");
        fs.appendFileSync(jsonFile, JSON.stringify({ v1: json.v1, v2: json.v2 }));
    },
        () => { },
        () => {
            console.log("File imported...");
            fs.appendFileSync(jsonFile, "]");
        });
}

//Training function
function train() {
    console.log("Training model...")

    let td = fs.readFileSync(trainingFile, 'utf8');
    let tdj = JSON.parse(td);
    tdj.forEach(record => {
        classifier.addDocument(record.v2, record.v1);
    });

    classifier.train();

    fs.writeFileSync(modelFile, JSON.stringify(classifier));

    console.log("Finished training model. Model saved to file " + modelFile);
}

//Validation function
function check(validationFile = validationFileJSON) {
    let model = fs.readFileSync(modelFile, 'utf8');
    classifier = natural.LogisticRegressionClassifier.restore(JSON.parse(model));

    td = fs.readFileSync(validationFile, 'utf8');
    tdj = JSON.parse(td);

    let correct = 0;
    let all = 0;

    tdj.forEach(record => {
        let label = classifier.classify(record.v2);
        if(label === record.v1){
            correct++;
        }
        all++;
    })

    console.log("Model score: " + correct + "/" + all + " perct: " + Number.parseFloat(correct/all).toPrecision(2))

    //spam
    console.log("==============SPAM==============")
    console.log(classifier.getClassifications("Urgent! call 09066612661 from landline. Your complementary 4* Tenerife Holiday or 10,000 cash await collection SAE T&Cs PO Box 3 WA14 2PX 150ppm 18+ Sender: Hol Offer"));
    console.log(classifier.getClassifications("Last Chance! Claim ur 150 worth of discount vouchers today! Text SHOP to 85023 now! SavaMob, offers mobile! T Cs SavaMob POBOX84, M263UZ. 3.00 Sub. 16"));

    //ham
    console.log("==============HAM==============")
    console.log(classifier.getClassifications("You might want to pull out more just in case and just plan on not spending it if you can, I don't have much confidence in derek and taylor's money management"));
    console.log(classifier.getClassifications("Idk. You keep saying that you're not, but since he moved, we keep butting heads over freedom vs. responsibility. And i'm tired. I have so much other stuff to deal with that i'm barely keeping myself together once this gets added to it."));


}

function main(args) {
    console.log('Hi, HYC!')

    // classifier.addDocument("Hi I am dog. I bark. Woof Woof", "DOG");
    // classifier.addDocument("I am cat. Humanity is my enemy. MEOW MEOW", "CAT");

    // classifier.train();

    // console.log(classifier.getClassifications("Don't bark at me!"));

    // convertCsvToJson()

    if (args[2] == "--train") {
        train();
    }

    if (args[2] == "--convert") {
        convertCsvToJson();
    }

    if (args[2] == "--check") {
        check();
    }

}


main(process.argv)
