<template>
    <div class="single-card">
        <img :src="src()" :alt="value" class="card-image" />
    </div>
</template>

<script>
export default {
    props: ['value'],
    methods: {
        src() {
            let images = require.context('../assets/cards/', false, /\.png$/)
            return images("./" + this.value + ".png")
        }
    }
}
</script>

<style scoped>
.single-card {
    margin: .25rem;
}
.card-image {
    width: 80px;
}
</style>
