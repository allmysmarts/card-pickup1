<template>
    <div class="container-fluid mt-3">
        <div class="d-flex justify-content-between">
            <!-- title -->
            <div class="d-flex">
                <button class="btn btn-primary mr-3" v-if="started && mycard==0" @click="bet" :disabled="betting">
                    <strong>&nbsp;&nbsp;BET&nbsp;&nbsp;</strong>
                </button>

                <div>
                    <div class="d-flex align-items-start"><h1>Simple Card Pickup Lottery</h1><sup class="badge badge-primary">KOVAN</sup></div>
                    <p class="text-muted mb-0">Bet <strong class="text-dark">0.01ETH</strong>. If <span class="text-danger">&#10084;3</span>, then you win<span class="text-warning">&#128513;</span> and get bonus, just <strong class="text-dark">90%</strong> of total bet!</p>
                </div>

                <button
                    v-if="pendingBonus>0 && !withdrawing" 
                    class="btn btn-danger text-white ml-3"
                    @click="withdraw"
                >
                    <small>Bonus</small> <h4><strong>{{pendingBonus}} ETH</strong></h4>
                </button>
            </div>

            <!-- configuration -->
            <div class="d-flex flex-column justify-content-end align-items-end">
                <p class="text-muted mb-2">Nickname</p>
                <h5 class="nickname" v-if="!editingNickName" @click="editingNickName=!editingNickName">{{nickName}} <i class="fas fa-cogs" /></h5>
                <input 
                    class="form-control"
                    v-model="nickName"
                    v-if="editingNickName"
                    @blur="endNicknameEditing"
                    @keyup.enter="onNicknameEnter"
                />
            </div>
        </div>
        <div class="row border-top mt-3">
            <!-- cards list -->
            <div class="col-9">
                <h2 class="pt-3">Playing status</h2>
                <div class="d-flex">
                    <card v-for="(card, index) in cards" :key="index" :value="card" />
                </div>
            </div>

            <!-- status details -->
            <div class="col-3">
                <h2 class="pt-3">Details</h2>
                <p>
                    <span class="text-muted">Started: </span>
                    <span class="badge" :class="started ? 'badge-primary' : 'badge-secondary'">
                        {{ started ? 'Yes' : 'No' }}
                    </span>
                </p>
                <p v-if="startedTime"><span class="text-muted">Started Time:</span>  {{ startedTime.toLocaleString() }}</p>
                <p v-if="endTime"><span class="text-muted">End Time:</span>  {{ endTime.toLocaleString() }}</p>
                <p v-if="timeLimit"><span class="text-muted">Time Limit:</span>  {{ timeLimit / 1000 / 60 / 60 }} H</p>
                <p v-if="lastWinner"><span class="text-muted">Latest Winner:</span> {{lastWinner}}</p>

                <div class="bg-light mt-5 p-3 rounded">
                    <h2>About Us</h2>
                    <p class="text-muted">
                        This is fully open-source project built with <a href="https://docs.soliditylang.org/en/v0.8.6/" target="_blank">Solidity</a> and <a href="https://vuejs.org/" target="_blank">VueJS</a>.<br/>
                    </p>
                    <h5>Source Repository (GitHub)</h5>
                    <p class="text-muted">
                        Smart Contract (Solidity): &nbsp;&nbsp;<a href="https://github.com/allmysmarts/pickup-lottery" target="_blank">Here</a><br/>
                        Front End (VueJS): &nbsp;&nbsp;<a href="https://github.com/allmysmarts/pickup-lottery-frontend" target="_blank">Here</a>
                    </p>
                    <h5>Buy me a coffee! <span class="text-warning">&#9749;&#9749;&#9749;&#9749;</span></h5>
                    <span>0x620dc94C842817d5d8b8207aa2DdE4f8C8b73415</span>
                </div>
            </div>
        </div>
        
    </div>
</template>

<script>
import Card from './Card.vue'
import web3 from '../contracts/web3'
import lottery from '../contracts/lottery'

export default {
    components: {
        Card
    },
    data() {
        return {
            cards: [],
            started: false,
            startedTime: null,
            endTime: null,
            leftTime: null,
            timeLimit: null,

            betting: false,
            mycard: 0,
            pendingBonus: 0,
            withdrawing: false,
            lastWinner: '',

            nickName: '',
            editingNickName: false
        }
    },
    methods: {
        feedStatus() {
            // console.log('active address: ', web3.eth.accounts.givenProvider.selectedAddress)

            let self = this
            lottery.methods.started().call()
                .then(status => {
                    // console.log('started(). Result: ', status)
                    if (status != self.started && status) {
                        self.betting = false
                    }
                    self.started = status
                })
            lottery.methods.startedAt().call()
                .then(ts => {
                    // console.log('startedAt(). Result: ', ts)
                    self.startedTime = new Date(ts * 1000)
                })
            lottery.methods.endedAt().call()
                .then(ts => {
                    // console.log('endedAt(). Result: ', ts)
                    self.endTime = ts > 0 ? new Date(ts * 1000) : null;
                })
            lottery.methods.leftTime().call()
                .then(ts => {
                    // console.log('leftTime(). Result: ', ts)
                    self.leftTime = ts;
                })
            lottery.methods.timeLimit().call()
                .then(ts => {
                    // console.log('timeLimit(). Result: ', ts)
                    self.timeLimit = ts;
                })
            lottery.methods.winner().call()
                .then(winner => {
                    // console.log('winner(). Result: ', winner)
                    self.lastWinner = winner;
                })

            lottery.methods.picked().call({from: web3.eth.accounts.givenProvider.selectedAddress})
                .then(card => {
                    // console.log('picked(). Result: ', card)
                    self.mycard = card
                })

            lottery.methods.all().call({from: web3.eth.accounts.givenProvider.selectedAddress})
                .then(cards => {
                    // console.log('all(). Result: ', cards)
                    self.cards = cards
                })
            lottery.methods.bonus().call({from: web3.eth.accounts.givenProvider.selectedAddress})
                .then(bonus => {
                    // console.log('bonus: ', bonus)
                    self.pendingBonus = bonus ? web3.utils.fromWei(bonus) : 0
                })
        },
        bet() {
            let self = this
            // get the wallet adddress
            const fromAddress = web3.eth.accounts.givenProvider.selectedAddress;
            // console.log('accounts: ', fromAddress)
            lottery
                .methods
                .pick(web3.utils.asciiToHex(self.nickName))
                .send(
                    {
                        from: fromAddress, 
                        value: web3.utils.toWei('0.01', 'ether')
                    }
                )
            this.betting = true
        },
        withdraw() {
            let self = this
            if (confirm('Are you sure to withdraw bonus into your wallet?')) {
                lottery.methods.withdraw().send({from: web3.eth.accounts.givenProvider.selectedAddress})
                .then((result) => {
                    // console.log('withdraw: ', result)
                    if (result) {
                        self.feedStatus()
                        self.withdrawing = true
                    }
                })
            }
        },

        getNickName() {
            return localStorage.getItem('clvNick')
        },
        setNickName(name) {
            return localStorage.setItem('clvNick', name)
        },
        endNicknameEditing() {
            this.editingNickName = false
            this.setNickName(this.nickName)
        },
        onNicknameEnter(e) {
            e.target.blur()
        }
    },
    beforeMount() {
        // console.log('Invoking methods to get status ...')
        this.feedStatus()

        let self = this
        // Listen Contract's event
        lottery.events.Started(function() {
            // console.log('Started event occured.', event)
            self.feedStatus()
        })
        lottery.events.Stopped(function() {
            // console.log('Stopped event occured.', event)
            self.feedStatus()
        })
        lottery.events.CardPicked(function() {
            // console.log('CardPicked event occured.', event)
            self.feedStatus()
        })

        // set default nickname
        this.nickName = this.getNickName()
        if (!this.nickName) {
            this.nickName = 'unknown'
            this.setNickName(this.nickName)
        }
    }
}
</script>

<style scoped>
.nickname {
    cursor: pointer;
}
</style>
