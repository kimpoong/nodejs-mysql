var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var mysql = require('mysql');

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '626933',
    database: 'nodejs'
});

db.connect();

var app = http.createServer((req, res) => {
    var queryData = url.parse(req.url, true).query;
    var pathname = url.parse(req.url, true).pathname;
    
    if (pathname == '/') {
        var id = queryData.id;
        var title;
        var description;
        var name;
        db.query(`
        SELECT topic.id AS id, title, description, name
        FROM topic
        LEFT JOIN author
        ON author_id=author.id`,
        (err, topics) => {
            if (err) throw err;
            console.log(topics);
            var list_html = '<ol>';
            topics.forEach((topic) => {
                if (id == topic.id) {
                    title = topic.title;
                    description = topic.description;
                    name = topic.name
                }
                list_html += `<li><a href="/?id=${topic.id}">${topic.title}</a></li>`;
            });
            list_html += '</ol>';
            var template;
            if (id == undefined) {
                title = 'front page';
                description = 'Welcome!';
                template = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Web-NodeJs:${title}</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <h1><a href="/">Web-NodeJs</a></h1>
                        ${list_html}
                        <p><a href="/create">create</a></p>
                        <h2>${title}</h2>
                        <p>${description}</p>
                    </body>
                </html>
                `;
            }
            else {
                template = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Web-NodeJs:${title}</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <h1><a href="/">Web-NodeJs</a></h1>
                        ${list_html}
                        <p>
                            <a href="/create">create</a>
                            <a href="/update?id=${id}">update</a>
                            <form action="/delete" method="post">
                                <input type="hidden" name="id" value="${id}">
                                <input type="submit" value="delete">
                            </form>
                        </p>
                        <h2>${title}</h2>
                        <p>${description}</p>
                        <h4>by ${name}</h4>
                    </body>
                </html>
                `;
            }
            res.writeHead(200);
            res.end(template);
        });
    }
    else if (pathname == '/create') {
        var template = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Web-NodeJs:create</title>
                <meta charset="utf-8">
            </head>
            <body>
                <h1><a href="/">Web-NodeJs</a></h1>
                <form action="/create_doc" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p><textarea name="description" placeholder="description"></textarea></p>
                    <p><input type="submit"></p>
                </form>
            </body>
        </html>
        `;
        res.writeHead(200);
        res.end(template);
    }
    else if (pathname == '/create_doc') {
        var body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            var post = qs.parse(body);
            db.query(`
            INSERT INTO topic (title, description, created, author_id)
            VALUES (?, ?, NOW(), ?)`, [post.title, post.description, 1], (err, result) => {
                if (err) throw err;
                res.writeHead(302, { Location: `/?id=${result.insertId}` });
                res.end();
            });
        });
    }
    else if (pathname == '/update') {
        var id = queryData.id;
        db.query(`SELECT title, description FROM topic WHERE id=?`, [id], (err, result) => {
            if (err) throw err;
            console.log(result);
            var template = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Web-NodeJs:update</title>
                    <meta charset="utf-8">
                </head>
                <body>
                    <h1><a href="/">Web-NodeJs</a></h1>
                    <form action="/update_doc" method="post">
                        <input type="hidden" name="id" value="${id}">
                        <p><input type="text" name="title" value="${result[0].title}"></p>
                        <p><textarea name="description">${result[0].description}</textarea></p>
                        <p><input type="submit"></p>
                    </form>
                </body>
            </html>
            `;
            res.writeHead(200);
            res.end(template);
        });
    }
    else if (pathname == '/update_doc') {
        var body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            var post = qs.parse(body);
            db.query(`
                UPDATE topic
                SET title=?, description=?, author_id=1
                WHERE id=?`,
            [post.title, post.description, post.id], (err, result) => {
                if (err) throw err;
                res.writeHead(302, { Location: `/?id=${post.id}` });
                res.end();
            });
        });
    }
    else if (pathname == '/delete') {
        var body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            var post = qs.parse(body);
            db.query(`DELETE FROM topic WHERE id=?`, [post.id], (err, result) => {
                if (err) throw err;
                res.writeHead(302, { Location: '/' });
                res.end();
            });
        })
    }
    else {
        res.writeHead(404);
        res.end('not found');
    }
    
});

app.listen(3000);