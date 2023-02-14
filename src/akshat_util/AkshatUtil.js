import {api_key, lambda_endpoint, secret_key} from "../secret";
import * as CryptoJS from 'crypto-js';
import {binanceEndpoint, getExchangeInfoPath, getOpenOrdersPath, newOrderPath} from "../config";
import Binance from 'binance-api-react-native';

const client = Binance({
    apiKey: api_key,
    apiSecret: secret_key,
});

let setOpenOrdersFunction;
let pairToSet;
let qtyRounder;
let priceRounder;

export function setter_setOpenOrdersFunction(func) {
    setOpenOrdersFunction = func;
}

export function setter_pairToSet(pair) {
    pairToSet = pair;
}

export function getSampleData() {
    return [
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
            // console.log('parsed lambda response: ', response);
            setOpenOrders(JSON.parse(response))
        });
    });

}

export function getExchangeInfo(symbol) {
    const baseUrl = `${binanceEndpoint}${getExchangeInfoPath}`
    createRequest(baseUrl, "", "GET").then(exchangeInfo => {
        const filters = JSON.parse(exchangeInfo).symbols.filter(symbolInfo => {
            return symbolInfo.symbol === symbol;
        })[0].filters;

        //parse qty and price precisions
        const qtyStepSize = filters.filter(fil => {
            return fil.filterType === "LOT_SIZE";
        })[0].stepSize;
        const priceStepSize = filters.filter(filter => {
            return filter.filterType === "PRICE_FILTER";
        })[0].tickSize;

        //update the rounders based on the responses
        qtyRounder = 1 / parseFloat(qtyStepSize);
        priceRounder = 1 / parseFloat(priceStepSize);
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


export function roundOff(float, isPrice) {
    const rounder = isPrice ? priceRounder : qtyRounder;
    return Math.round(float * rounder) / rounder;
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
        // alert("Order placed successfully.");
        getOpenOrders(pairToSet, setOpenOrdersFunction);
    }
}