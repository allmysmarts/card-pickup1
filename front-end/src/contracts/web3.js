import Web3 from 'web3'

if (window.ethereum) {
    // metamask
    window.web3 = new Web3(window.ethereum)
    try {
        // request account access if needed
        window.ethereum.enable()
    } catch(error) {
        // user denied account access
    }
} else if (window.web3) {
    // legacy dapp browser
    window.web3 = new Web3(window.web3.currentProvider)
} else {
    console.log('Non-ethereum browser detected. You should install MetaMask!')
}

export default window.web3
