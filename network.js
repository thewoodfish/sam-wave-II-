import { createRequire } from "module";
const require = createRequire(import.meta.url);

import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as IPFS from "ipfs-core";
import { json } from "express";
const toBuffer = require('it-to-buffer');

const { Keyring } = require('@polkadot/keyring');
import { stringToU8a, u8aToHex } from '@polkadot/util';

const fs = require("fs");
const https = require("https");

const keyring = new Keyring({ type: 'sr25519' });

const util = require("./utility.cjs");
const ipfs = await IPFS.create();

// using alice here temporarily
const alice = keyring.addFromUri('//Alice');

export async function uploadToIPFS(path) {
    const { cid } = await ipfs.add(path);

    console.info(cid);

    if (cid) 
        console.log(cid.toV0().toString());
    else 
        throw new Error('IPFS add failed, please try again.');

    return cid;
}

export async function getFromIPFS(cid) {
    const bufferedContents = await toBuffer(ipfs.cat(cid)); // returns a Buffer

    return bufferedContents;
}

function generateVM(did, hash, mnemnic, suffix) {
    // generate a hard derivation from the mnemonic
    const keyring = new Keyring();
    let nkey = keyring.createFromUri(`${mnemnic}//${suffix}`);

    return {
        "id": did + hash,
        "type": "Ed25519VerificationKey",
        "controller": did,
        "SS58format": 0,
        "publicKeyMultibase": keyring.encodeAddress(nkey.publicKey, 0)
    }
}

export async function createDIDoc(did, mnemonic) {
    let vm = generateVM(did, getKeyHash("assertion"), mnemonic, "assertion");

    let json = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://www.sam.org/did/v1"
        ],
        "id": did,
        "assertionMethod": [
            vm
        ]
    };

    return JSON.stringify(json);
}

async function fetchJSON(url) {
    const link = "public/docs/data.txt";
    const file = fs.createWriteStream(link);
    var data = {};

    https.get(url, response => {
        var stream = response.pipe(file);

        stream.on("finish", function() {
            fs.readFile(link, 'utf8', function (err, data) {
                if (err) 
                    return console.log(err);
        
                json_content = data = JSON.parse(JSON.stringify(data));
                console.log(data);
            });
        });
    });

}

// construct VC here and sign it (as per let the user assert it (not the best to beleive))
export function constructVC(did, cred, sbjct, nonce) {
    let attr = cred.attr;
    let type = cred.type;

    let json = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
        ],
        "id": `${did}/vc/${nonce}}`,
        "type": ["VerifiableCredential", `${type}Credential`],
        "issuer": did,
        "issuanceDate": util.getXMLDate(),
        "credentialSubject": {
            "id": sbjct,
            "attr": attr
        }
    }

    return json;
}

// get JSON contents from file
async function readJSONFile(url) {
    // get JSON content
    return fs.readFile(url, 'utf8', function (err, data) {
        if (err) 
            return console.log(err);

        return JSON.parse(JSON.stringify(data));
    });
}

function getKeyHash(key) {
    let hash = {
        "authentication": "#key-0",
        "assertion": "#key-1"
    };

    return hash[key];
}

// sign a credential
export async function signCredential(did, cred) {
    const message = stringToU8a(JSON.stringify(cred));
    const signature = alice.sign(message);

    cred["proof"] = {
        "type": "Ed25519VerificationKey",
        "created": util.getXMLDate(),
        "verificationMethod": did + getKeyHash("assertion"),
        "proofPurpose": "assertionMethod",
        "proofValue": util.uint8ToBase64(signature) // base-64 encoding
    }; 

    return cred;
}
