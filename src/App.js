import './App.css';
import {useEffect, useRef, useState} from "react";
import {
    createLimitOrder,
    createMarketOrder, createRiskCalcOrder,
    createStopLimitOrder, getOpenOrders,
    getSampleData, pairToSet,
    parseData,
    parseSingleData, roundOff, setOpenOrdersFunction, setter_pairToSet, setter_setOpenOrdersFunction
} from "./akshat_util/AkshatUtil";
import Chart from "./components/Chart";
import Binance from 'binance-api-react-native';
import 'react-dropdown/style.css';
import "react-toggle/style.css"
import Toggle from 'react-toggle'
import Buy from "./components/Buy";
import Sell from "./components/Sell";
import {CreateOrderInput} from "./state/CreateOrderInput";
import {api_key, secret_key} from "./secret";


function App() {
    const [data, setData] = useState(getSampleData());
    const [openOrders, setOpenOrders] = useState();

    // get parameters
    const pair = new URLSearchParams(window.location.search).get('pair');
    setter_pairToSet(pair);
    let interval = new URLSearchParams(window.location.search).get('interval');
    if (interval == null) {
        interval = '1m';
    }
    const title = pair + ' - ' + interval


    // references
    let amountValueRef = useRef();
    let riskValueRef = useRef();
    let reduceOnlyEnabledRef = useRef();
    let buySellToggle = useRef();
    let stopLossSlippageRef = useRef();

    //toggle button on pressing K
    const keyDownHandler = function (e) {
        if (e.key === 'k') {
            buySellToggle.current.state.checked = !buySellToggle.current.state.checked
        }

    };
    document.addEventListener('keydown', keyDownHandler);

    useEffect(() => {
        const client = Binance({
            apiKey: api_key,
            apiSecret: secret_key,
        });

        // set up initial candles
        client.candles({symbol: pair, interval: interval, limit: 50}).then(value => {
            console.log('candles', value)
            const newData = parseData(value)
            setData(newData)
        });

        // create websockets to update candles based on real time data
        client.ws.candles(pair, interval, candle => {
            setData(oldData => {
                let newData = [...oldData];
                const lastDate = newData[newData.length - 1].x
                if (lastDate.getTime() !== new Date(candle.startTime).getTime()) {
                    // new candle, remove the oldest candle and replace with new one
                    newData.shift();
                    newData.push(parseSingleData(candle));
                    return newData;
                } else {
                    // update the latest candle
                    newData.pop();
                    newData.push(parseSingleData(candle));
                    return newData;
                }
            })
        });

        getOpenOrders(pair, setOpenOrders);
        setter_setOpenOrdersFunction(setOpenOrders);
    }, [pair, interval]);


    function createLimitOrderWithValue(value) {
        console.log(amountValueRef.current.value)
        const createOrderInput = new CreateOrderInput(
            buySellToggle.current.state.checked ? "BUY" : "SELL",
            value,
            null,
            parseFloat(amountValueRef.current.value),
            'GTC',
            reduceOnlyEnabledRef.current.value,
            null,
            "LIMIT",
            pair
        );
        console.log('createOrderInput', createOrderInput)
        return createLimitOrder(createOrderInput);
    }

    function createStopLimitOrderWithValue(value) {
        const stopLossSlippage = parseFloat(stopLossSlippageRef.current.value);
        const stopPrice = value;
        const side = buySellToggle.current.state.checked ? "BUY" : "SELL";
        let price;
        if (side === "BUY") {
            price = stopPrice + (stopPrice * stopLossSlippage / 100);
        } else {
            price = stopPrice - (stopPrice * stopLossSlippage / 100);
        }
        price = roundOff(price);
        const createOrderInput = new CreateOrderInput(
            side,
            price,
            stopPrice,
            parseFloat(amountValueRef.current.value),
            'GTC',
            reduceOnlyEnabledRef.current.value,
            stopLossSlippage,
            "STOP_LOSS_LIMIT",
            pair
        );
        console.log('createOrderInput', createOrderInput)
        return createStopLimitOrder(createOrderInput);
    }

    function createMarketOrderWithValue(value) {
        console.log(amountValueRef.current.value)
        const createOrderInput = new CreateOrderInput(
            buySellToggle.current.state.checked ? "BUY" : "SELL",
            value,
            null,
            parseFloat(amountValueRef.current.value),
            'GTC',
            reduceOnlyEnabledRef.current.value,
            null,
            "MARKET",
            pair
        );
        console.log('createOrderInput', createOrderInput)
        return createMarketOrder(createOrderInput);
    }

    function createRiskCalcOrderWithValue(entryPrice, stopLossPrice) {
        const risk = parseFloat(riskValueRef.current.value);
        let quantity = risk / (stopLossPrice - entryPrice);
        quantity = quantity > 0 ? quantity : quantity * -1;
        quantity = roundOff(quantity);
        const createOrderInput = new CreateOrderInput(
            buySellToggle.current.state.checked ? "BUY" : "SELL",
            entryPrice,
            stopLossPrice,
            quantity,
            'GTC',
            reduceOnlyEnabledRef.current.value,
            null,
            "STOP",
            pair
        );
        console.log('createOrderInput', createOrderInput)
        return createRiskCalcOrder(createOrderInput);
    }

    return (
        <div>
            {/*<select name="selectList" id="selectList" onClick={intervalSelected}>*/}
            {/*    <option value="1m">1m</option>*/}
            {/*    <option value="5m">5m</option>*/}
            {/*    <option value="15m">15m</option>*/}
            {/*    <option value="30m">30m</option>*/}
            {/*    <option value="1h">1h</option>*/}
            {/*    <option value="4h">4h</option>*/}
            {/*    <option value="1d">1d</option>*/}
            {/*</select>*/}
            {/*<Dropdown options={options} onChange={intervalSelected} value={defaultOption}/>*/}
            <Chart data={data}
                   title={title}
                   openOrders={openOrders}
                   limitOrderFunction={createLimitOrderWithValue}
                   stopLimitOrderFunction={createStopLimitOrderWithValue}
                   marketOrderFunction={createMarketOrderWithValue}
                   riskCalcOrderFunction={createRiskCalcOrderWithValue}
            />
            <br/>
            Quantity: <input ref={amountValueRef} type="text" defaultValue="0.1"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Toggle
                defaultChecked={false}
                ref={buySellToggle}
                icons={{
                    checked: <Buy/>,
                    unchecked: <Sell/>,
                }}
            />
            <br/>
            <input ref={reduceOnlyEnabledRef} type="checkbox" defaultValue="false"/> Reduce Only
            <br/>
            StopLossSlippage: <input ref={stopLossSlippageRef} type="text" defaultValue="1" style={{width: 20}}/>%
            <br/>
            Risk: $<input ref={riskValueRef} type="text" defaultValue="100"/>

        </div>
    );
}

export default App;
