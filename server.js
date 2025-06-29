const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());

// Multer để nhận file Excel
const upload = multer({ dest: 'uploads/' });

// Kết nối MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Nhập mật khẩu root nếu bạn có
  database: 'nghia_trang_db'
});

// Kết nối kiểm tra
db.connect(err => {
  if (err) throw err;
  console.log("✅ Đã kết nối MySQL thành công");
});

// Upload file Excel
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  let inserted = 0;

  data.forEach(row => {
    const {
      "Họ và tên": full_name,
      "Quê quán": hometown,
      "Đơn vị": unit,
      "Năm hi sinh": death_year,
      "Lý do hi sinh": reason,
      "Địa điểm hi sinh": death_location,
      "Nơi an táng": burial_place
    } = row;

    db.query(
      `INSERT INTO liet_si (full_name, hometown, unit, death_year, reason, death_location, burial_place)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, hometown, unit, death_year, reason, death_location, burial_place],
      (err) => {
        if (!err) inserted++;
      }
    );
  });

  res.json({ message: 'Đã xử lý file Excel', inserted, total: data.length });
});

// API tra cứu
app.get('/search', (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "Thiếu tên cần tìm" });

  db.query("SELECT * FROM liet_si WHERE full_name LIKE ?", [`%${name}%`], (err, results) => {
    if (err) return res.status(500).json({ error: 'Lỗi truy vấn DB' });
    res.json(results);
  });
});

app.listen(3001, () => {
  console.log("🚀 Server đang chạy tại http://localhost:3001");
});
