const app = new Vue({
    el: "#app",
    data: {
        log: [],
        type: "process",
        amount: 100,
        autoScroll: true
    },
    mounted: async function () {
        document.getElementById('log-field').addEventListener('scroll', this.handleScroll)
        await this.getLog();
        this.cycle();
    },
    methods: {
        async getLog() {

            await fetch("/api/v2/getLogs/" + location.pathname.split("/log/")[1] + "/" + this.type + "/" + this.amount).then(async response => {
                const res = await response.json();
                if (res["state"] != undefined) {
                    this.log = [["", "invalid permission or process, reload page"]]
                } else {
                    this.log = [["", " wating for " + this.type + " logs.. "]]
                    if (res["log"].includes("\n")) {
                        this.log = []
                        res.log.split('\n').forEach(l => {
                            if (l.startsWith('202')) {
                                this.log.push([l.split(': ')[0], l.split(l.split(': ')[0])[1]])
                            } else {
                                this.log.push(["", l])
                            }
                        })
                    } else {
                        this.log = [["", res.log]]
                    }
                }
            })

            var lf = document.getElementById("log-field")
            if (this.autoScroll) {
                lf.scrollTop = lf.scrollHeight
            }
        },

        handleScroll() {
            var lf = document.getElementById("log-field")
            if (lf.scrollTop > lf.scrollHeight - lf.offsetHeight) {
                this.autoScroll = true
            } else {
                this.autoScroll = false
            }

            if (lf.scrollHeight - lf.offsetHeight > 500 && lf.scrollTop == 0) {
                this.amount += 100;
                this.getLog();
            }
        },

        resetMessage(delay) {
            setTimeout(() => {
                this.message = "";
            }, delay || 5000);
        },

        cycle(){
            setTimeout(() => {
                this.getLog();
                this.cycle();
            }, 2500);
        }
    }
})
