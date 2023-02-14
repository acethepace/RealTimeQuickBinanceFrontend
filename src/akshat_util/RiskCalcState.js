let riskCalcKeyDownState;

export function getRiskCalcState() {
    return riskCalcKeyDownState;
}

export function setRiskCalcState(state) {
    console.log('set as: ', state)
    riskCalcKeyDownState = state;
}