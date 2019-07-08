const axios = require("axios");
const Koa = require("koa");
const Router = require("koa-router");
const Compress = require("koa-compress");
const parameter = new (require("parameter"))();

const app = new Koa();
const router = new Router();

const SCHEME = {
    ID: {
        type: "int",
        convertType: "int",
        required: true,
        min: 0
    },
    language: {
        type: "string",
        required: true,
        allowEmpty: false,
        trim: true
    }
};

router.get("/", async ctx => {
    const errors = parameter.validate(SCHEME, ctx.query);
    if (errors) {
        console.log(errors);
        ctx.body = errors;
        return;
    }

    const response = await axios.get(
        `https://itunes.apple.com/${ctx.query.language}/rss/customerreviews/id=${ctx.query.ID}/sortBy=mostRecent/json`
    );

    const rawReviews = response.data["feed"]["entry"];

    const processedReviews = rawReviews
        .map(
            review => {
                return {
                    author: review["author"]["name"]["label"],
                    version: review["im:version"]["label"],
                    rating: parseInt(review["im:rating"]["label"]),
                    title: review["title"]["label"],
                    content: review["content"]["label"]
                }
            }
        );

    ctx.body = processedReviews;
});

app
    .use(Compress())
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(80, () => console.log("[SERVER] Listening"));