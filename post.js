const express = require("express");
const path = require('path');
const multer = require("multer");
const fs = require("fs");

const app = express();

try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, done) {
        done(null, __dirname + '/uploads');
      },
      filename(req, file, done) {
        const ext = path.extname(file.originalname);
        done(null, path.basename(file.originalname, ext) + Date.now() + ext);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.get('/images', (req, res) => {
    res.sendFile(path.join(__dirname, 'multipart.html'));
  });

  app.post('/images', upload.single('image'), (req, res, next) => {
    const { fieldname, originalname, encoding, mimetype, destination, filename, path, size } = req.file
    const { name } = req.body;
    console.log("body 데이터 : ", name);
    console.log("폼에 정의된 필드명 : ", fieldname);
    console.log("사용자가 업로드한 파일 명 : ", originalname);
    console.log("파일의 엔코딩 타입 : ", encoding);
    console.log("파일의 Mime 타입 : ", mimetype);
    console.log("파일이 저장된 폴더 : ", destination);
    console.log("destinatin에 저장된 파일 명 : ", filename);
    console.log("업로드된 파일의 전체 경로 ", path);
    console.log("파일의 바이트(byte 사이즈)", size);
    const DiaryId = 1;
    const ImageUrl = `/images/${req.file.filename}`;
    const datas = [DiaryId, ImageUrl];


    const sql = 
    "INSERT INTO memorealdb.image(DiaryId, ImageUrl) VALUES (?, ?)";

    Connection.query(sql, datas, (err, rows) => {
        if (err) {
            console.error("err : " + err);
        } else {
            console.log("rows : " + JSON.stringify(rows));
            res.send(rows);
            //res.redirect("/img"+ filename);
        }
    });

    res.json({ url : ImageUrl });
  });
  
  module.exports = app;