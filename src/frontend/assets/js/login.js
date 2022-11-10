document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.body.classList.add("loaded");
        document.getElementById('loading-msg').innerText = "";
    }, 100);
});

const app = new Vue({
    el: "#app",
    data: {
        username: "",
        password: "",
        message: "",
        save: false
    },
    mounted: function() {

    },
    methods: {
        async login(){
            console.log(this.username)
            if(this.username.length < 2 || this.password.length < 2){
                this.message = "invalid input";
                this.resetMessage();
                return;
            }
            console.log(this.username, this.password, this.save)
            this.message = "fetching..";

            await fetch("/api/v2/auth", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    username: this.username,
                    password: this.password,
                    save: this.save
                })
            }).then(async response => {
                const result = await response.json();
                if(result["state"] == "success"){
                    // redirect
                }
                this.message = result["state"];
                this.resetMessage();   
            })

        },

        help(){
            window.open("https://github.com/sendQueue/deployment-manager", '_blank').focus();
        },

        resetMessage(delay){
            setTimeout(() => {
                this.message = "";
            }, delay || 5000);
        }
    }
})
