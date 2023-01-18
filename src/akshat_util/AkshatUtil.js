import {api_key, lambda_endpoint, secret_key} from "../secret";
import * as CryptoJS from 'crypto-js';
import {binanceEndpoint, getOpenOrdersPath, newOrderPath} from "../config";
import Binance from 'binance-api-react-native';

const client = Binance({
    apiKey: api_key,
    apiSecret: secret_key,
});

let setOpenOrdersFunction;
let pairToSet;

export function setter_setOpenOrdersFunction(func) {
    setOpenOrdersFunction = func;
}

export function setter_pairToSet(pair) {
    pairToSet = pair;
}

export function getSampleData() {
    return [
        {x: new Date("2017-01-01"), y: [36.61, 38.45, 36.19, 36.82]},
        {x: new Date("2017-02-01"), y: [36.82, 36.95, 34.84, 36.20]},
        {x: new Date("2017-03-01"), y: [35.85, 36.30, 34.66, 36.07]},
        {x: new Date("2017-04-01"), y: [36.19, 37.50, 35.21, 36.15]},
        {x: new Date("2017-05-01"), y: [36.11, 37.17, 35.02, 36.11]},
        {x: new Date("2017-06-01"), y: [36.12, 36.57, 33.34, 33.74]},
        {x: new Date("2017-07-01"), y: [33.51, 35.86, 33.23, 35.47]},
        {x: new Date("2017-08-01"), y: [35.66, 36.70, 34.38, 35.07]},
        {x: new Date("2017-09-01"), y: [35.24, 38.15, 34.93, 38.08]},
        {x: new Date("2017-10-01"), y: [38.12, 45.80, 38.08, 45.49]},
        {x: new Date("2017-11-01"), y: [45.97, 47.30, 43.77, 44.84]},
        {x: new Date("2017-12-01"), y: [44.73, 47.64, 42.67, Math.random()]}
    ];
}

export function createLimitOrder(input) {
    client.time().then(timestamp => {
            const queryString = `symbol=${input.pair}&side=${input.side}&price=${input.price}&quantity=${input.quantity}&timeInForce=${input.timeInForce}&reduceOnly=${input.isReduceOnly}&type=LIMIT&timestamp=${timestamp}`
            const baseUrl = `${binanceEndpoint + newOrderPath}`
            createRequest(baseUrl, queryString, "POST")
                .then(response => handleResponse(response));
        }
    );
}

export function createMarketOrder(input) {
    client.time().then(timestamp => {
            const queryString = `symbol=${input.pair}&side=${input.side}&quantity=${input.quantity}&reduceOnly=${input.isReduceOnly}&type=MARKET&timestamp=${timestamp}`
            const baseUrl = `${binanceEndpoint + newOrderPath}`
            createRequest(baseUrl, queryString, "POST")
                .then(response => handleResponse(response));
        }
    );
}

export function createStopLimitOrder(input) {
    client.time().then(timestamp => {
            const queryString = `symbol=${input.pair}&side=${input.side}&quantity=${input.quantity}&price=${input.price}&stopPrice=${input.stopPrice}&reduceOnly=${input.isReduceOnly}&type=STOP&timestamp=${timestamp}`
            const baseUrl = `${binanceEndpoint + newOrderPath}`
            createRequest(baseUrl, queryString, "POST")
                .then(response => handleResponse(response));
        }
    );
}

export function createRiskCalcOrder(input) {
    client.time().then(timestamp => {
            const queryString = `symbol=${input.pair}&side=${input.side}&quantity=${input.quantity}&price=${input.price}&stopPrice=${input.stopPrice}&reduceOnly=${input.isReduceOnly}&type=STOP&timestamp=${timestamp}`
            const baseUrl = `${binanceEndpoint + newOrderPath}`
            createRequest(baseUrl, queryString, "POST")
                .then(response => handleResponse(response));
        }
    );
}

export function parseData(values) {
    return values.map(
        datapoint => {
            return {
                x: new Date(datapoint.openTime),
                y: [parseFloat(datapoint.open), parseFloat(datapoint.high), parseFloat(datapoint.low), parseFloat(datapoint.close)]
            }
        }
    )
}

export function parseSingleData(datapoint) {
    return {
        x: new Date(datapoint.startTime),
        y: [parseFloat(datapoint.open), parseFloat(datapoint.high), parseFloat(datapoint.low), parseFloat(datapoint.close)]
    }
}

export function getOpenOrders(pair, setOpenOrders) {
    client.time().then(timestamp => {

        const baseUrl = `${binanceEndpoint}${getOpenOrdersPath}`
        const queryString = `symbol=${pair}&timestamp=${timestamp}`
        createRequest(baseUrl, queryString, "GET").then(response => {
            console.log('parsed lambda response: ', response);
            setOpenOrders(JSON.parse(response))
        });
    });

}

export function getStripLinesFromOpenOrders(openOrders) {
    if (!openOrders)
        return []
    const striplines = openOrders.map(openOrder => {
        let colour = "black"
        if (openOrder.type === "LIMIT") {
            if (openOrder.side === "BUY") {
                colour = "green";
            } else {
                colour = "red"
            }
        } else if (openOrder.type === "STOP") {
            colour = "blue"
        }
        const value = openOrder.price
        return {
            value: parseFloat(value),
            color: colour,
            label: value,
            labelFontColor: colour
        };
    });
    return striplines;
}

export function roundOff(float) {
    return Math.round(float * 1e1) / 1e1
}

function createRequest(baseUrl, queryString, method) {
    console.log("creating request for :", queryString)
    const hash = CryptoJS.HmacSHA256(queryString, secret_key);
    const signature = hash.toString(CryptoJS.enc.Hex);

    const url = `${baseUrl}?${queryString}&signature=${signature}`
    const base64url = btoa(url);

    return fetch(`${lambda_endpoint}/prod?url=${base64url}&api_key=${api_key}&method=${method}`)
        .then(response => response.json());
}

function handleResponse(response) {
    console.log("lambda response", response);
    if (response.msg) {
        alert("Error while executing: " + response.msg);
    } else if (JSON.parse(response).orderId) {
        alert("Order placed successfully.");
        getOpenOrders(pairToSet, setOpenOrdersFunction);
    }
}