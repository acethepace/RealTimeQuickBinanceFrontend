export class CreateOrderInput {
    constructor(side, price, stopPrice, quantity, timeInForce, isReduceOnly, stopLossSlippage, type, pair) {
        this._price = price
        this._side = side;
        this._stopPrice = stopPrice;
        this._quantity = quantity;
        this._timeInForce = timeInForce;
        this._isReduceOnly = isReduceOnly;
        this._stopLossSlippage = stopLossSlippage;
        this._type = type;
        this._pair = pair;
    }


    get side() {
        return this._side;
    }

    set side(value) {
        this._side = value;
    }

    get stopPrice() {
        return this._stopPrice;
    }

    set stopPrice(value) {
        this._stopPrice = value;
    }

    get quantity() {
        return this._quantity;
    }

    set quantity(value) {
        this._quantity = value;
    }

    get timeInForce() {
        return this._timeInForce;
    }

    set timeInForce(value) {
        this._timeInForce = value;
    }

    get isReduceOnly() {
        return this._isReduceOnly;
    }

    set isReduceOnly(value) {
        this._isReduceOnly = value;
    }

    get stopLossSlippage() {
        return this._stopLossSlippage;
    }

    set stopLossSlippage(value) {
        this._stopLossSlippage = value;
    }

    get price() {
        return this._price;
    }

    set price(value) {
        this._price = value;
    }

    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }

    get pair() {
        return this._pair;
    }

    set pair(value) {
        this._pair = value;
    }
}