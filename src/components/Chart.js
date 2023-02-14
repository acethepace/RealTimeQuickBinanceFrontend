import React, {Component} from 'react';
import CanvasJSReact from '../canvasjs.react';
import {getStripLinesFromOpenOrders, roundOff} from "../akshat_util/AkshatUtil";
import {getRiskCalcState, setRiskCalcState} from "../akshat_util/RiskCalcState";

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class Chart extends Component {

    render() {

        // asynchronously updated variables
        let crosshairValue = 0;
        let isMarketKeyDown = false;
        let isRiskCalcKeyDown = false;
        let entryPrice = 0;

        // M Key handlers
        const keyDownHandler = function (e) {
            if (e.key === 'm') {
                isMarketKeyDown = true;
            } else if (e.key === ' ') {
                isRiskCalcKeyDown = true;
            }

        };
        const keyUpHandler = function (e) {
            if (e.key === 'm') {
                isMarketKeyDown = false;
            } else if (e.key === ' ') {
                isRiskCalcKeyDown = false;
                setRiskCalcState(false);
            }
        };
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);


        const props = this.props;

        // when the chart is clicked
        function divClick(e) {
            console.log("registered click on : " + crosshairValue);
            if (isMarketKeyDown) {
                props.marketOrderFunction(crosshairValue)
            } else if (isRiskCalcKeyDown) {
                if (!getRiskCalcState()) {
                    entryPrice = crosshairValue;
                    setRiskCalcState(true);
                } else {
                    props.riskCalcOrderFunction(entryPrice, crosshairValue);
                }
            } else if (e.ctrlKey) {
                props.limitOrderFunction(crosshairValue);
            } else if (e.shiftKey) {
                props.stopLimitOrderFunction(crosshairValue);
            } else {
                alert("registered no-action click on : " + crosshairValue);
            }
        }

        let dataMax = props.data[0].y[0]
        let dataMin = props.data[0].y[0]
        this.props.data.forEach(data => {
            dataMax = Math.max(...data.y, dataMax)
            dataMin = Math.min(...data.y, dataMin)
        });

        //chart options
        const options = {
            theme: "light2", // "light1", "light2", "dark1", "dark2"
            animationEnabled: true,
            exportEnabled: true,
            title: {
                text: this.props.title
            },
            axisX: {
                // valueFormatString: "MMM"
            },
            axisY: {
                prefix: "$",
                title: "Price (in USD)",
                crosshair: {
                    enabled: true,
                    updated: function (e) {
                        crosshairValue = roundOff(e.value, true)
                    }
                },
                maximum: dataMax + (dataMax - dataMin) * 0.3,
                stripLines: getStripLinesFromOpenOrders(this.props.openOrders)
            },
            data: [{
                type: "candlestick",
                showInLegend: true,
                name: this.props.title,
                yValueFormatString: "$###0.00",
                xValueFormatString: "MMMM YY",
                dataPoints: this.props.data
            }]
        }
        return (
            <div onClick={divClick}>
                <CanvasJSChart options={options}
                               onRef={ref => this.chart = ref}
                               containerProps={{width: '100%', height: '600px'}}
                />
            </div>
        );
    };
}

Chart.propTypes = {};

export default Chart;