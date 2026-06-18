export const courseData = {
  1: {
    kicker: "Checkpoint 01 · Mulai di sini",
    title: "Bagaimana Program Bisa Memilih?",
    duration: "Video 1 · Konsep dasar",
    videoId: "MLgrQoRo2oo",
    bookmarks: [{"time": 0, "label": "Pengenalan Conditional"}, {"time": 21, "label": "Program Tidak Lurus"}, {"time": 59, "label": "Keputusan Sehari-hari"}, {"time": 85, "label": "Apa Itu Condition?"}, {"time": 126, "label": "Condition Kayak Pintu"}],
    quizzes: []
  },
  2: {
    kicker: "Checkpoint 02 · Saatnya praktik",
    title: "Menulis Conditional di Python",
    duration: "Video 2 · Praktik kode",
    videoId: "-hYK440Vlr8",
    bookmarks: [{"time": 0, "label": "If dan Else di Python"}, {"time": 43, "label": "Conditional if"}, {"time": 133, "label": "Cara Membaca if"}, {"time": 201, "label": "True atau False"}, {"time": 264, "label": "Kalau Kondisi Salah"}, {"time": 409, "label": "Menambahkan else"}, {"time": 433, "label": "Seperti Dua Jalan"}, {"time": 506, "label": "Contoh Program Game"}],
    quizzes: [
      {
        time: 300,
        shown: false,
        resume: true,
        resumeTime: 306,
        questions: [
          {
            question: "Syarat dalam pemrograman yang bernilai benar disebut dengan True.",
            answer: true,
            explanation: "Benar. True berarti kondisi tersebut terpenuhi."
          },
          {
            question: "Keputusan dalam pemrograman mirip seperti kita memilih tindakan di kehidupan nyata berdasarkan suatu syarat.",
            answer: true,
            explanation: "Benar. Keduanya memakai pola: jika syarat terpenuhi, lakukan aksi."
          },
          {
            question: "Komputer akan tetap menjalankan perintah di dalam 'if' walaupun syaratnya bernilai False.",
            answer: false,
            explanation: "Salah. Jika syarat bernilai False, perintah di dalam blok if akan dilewati."
          },
          {
            question: "Dalam membuat syarat (kondisi), kita tidak bisa membandingkan angka.",
            answer: false,
            explanation: "Salah. Kita bisa menggunakan operator perbandingan seperti >, <, ==, dll pada angka."
          }
        ]
      },
      {
        time: 617,
        shown: false,
        resume: true,
        resumeTime: 620,
        questions: [
          {
            html: `
              <h2 class="slide-title">Tebak Output 1 🕵️‍♂️</h2>
              <div class="slide-text">
              <p>Perhatikan kode berikut:</p>
              <div class="code-block">
<span class="keyword">weather</span> <span class="operator">=</span> <span class="string">"hujan"</span><br><br>
<span class="keyword">if</span> weather <span class="operator">==</span> <span class="string">"cerah"</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Main bola di luar!")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Main game di rumah.")
              </div>
              <p>Apa yang akan dicetak oleh program di atas?</p>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button class="answer-opt-btn" data-correct="false" data-explanation="Karena <code>weather</code> adalah <code>&quot;hujan&quot;</code>, maka kondisi <code>if</code> bernilai <b>False</b>, jadi program pindah to <code>else</code>." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Main bola di luar!</button>
                  <button class="answer-opt-btn" data-correct="true" data-explanation="Karena <code>weather</code> adalah <code>&quot;hujan&quot;</code>, maka kondisi <code>if</code> bernilai <b>False</b>, jadi program pindah to <code>else</code>." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Main game di rumah.</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          },
          {
            html: `
              <h2 class="slide-title">Tebak Output 2 🕵️‍♂️</h2>
              <div class="slide-text">
              <p>Perhatikan kode berikut:</p>
              <div class="code-block">
<span class="keyword">score</span> <span class="operator">=</span> <span class="string">80</span><br><br>
<span class="keyword">if</span> score <span class="operator">&gt;</span> <span class="string">75</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Kamu Lulus!")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Coba lagi tahun depan.")
              </div>
              <p>Apa yang akan dicetak oleh program di atas?</p>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button class="answer-opt-btn" data-correct="true" data-explanation="Karena <code>80</code> memang lebih besar dari <code>75</code>, maka kondisi bernilai <b>True</b>." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Kamu Lulus!</button>
                  <button class="answer-opt-btn" data-correct="false" data-explanation="Karena <code>80</code> memang lebih besar dari <code>75</code>, maka kondisi bernilai <b>True</b>." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Coba lagi tahun depan.</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          },
          {
            html: `
              <h2 class="slide-title">Tebak Output 3 🕵️‍♂️</h2>
              <div class="slide-text">
              <p>Perhatikan kode berikut:</p>
              <div class="code-block">
<span class="keyword">is_hungry</span> <span class="operator">=</span> <span class="keyword">False</span><br><br>
<span class="keyword">if</span> is_hungry <span class="operator">==</span> <span class="keyword">True</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Waktunya makan!")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Lanjut belajar.")
              </div>
              <p>Apa yang akan dicetak oleh program di atas?</p>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button class="answer-opt-btn" data-correct="false" data-explanation="Karena <code>is_hungry</code> adalah <b>False</b>, pengecekan <code>False == True</code> bernilai salah, jadi pindah ke <code>else</code>." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Waktunya makan!</button>
                  <button class="answer-opt-btn" data-correct="true" data-explanation="Karena <code>is_hungry</code> adalah <b>False</b>, pengecekan <code>False == True</code> bernilai salah, jadi pindah ke <code>else</code>." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Lanjut belajar.</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      },
      {
        time: 617,
        shown: false,
        resume: false,
        questions: [
          {
            question: "Multi-branch decision adalah keputusan dengan banyak cabang pilihan yang dapat dieksekusi bersamaan.",
            answer: false,
            explanation: "Salah. Program hanya akan menjalankan satu cabang yang kondisinya pertama kali terpenuhi, tidak bersamaan."
          },
          {
            question: "Dalam Python, kita dapat membuat percabangan yang lebih dari dua jalan menggunakan kata kunci 'elif'.",
            answer: true,
            explanation: "Benar. 'elif' (else if) memungkinkan kita mengecek kondisi baru jika kondisi sebelumnya bernilai salah."
          },
          {
            question: "Urutan kondisi pada if-elif sangat penting karena Python membaca dari atas ke bawah dan berhenti pada kondisi pertama yang benar.",
            answer: true,
            explanation: "Benar. Python akan mengeksekusi blok kode dari kondisi pertama yang True dan mengabaikan pengecekan di bawahnya."
          }
        ]
      }
    ]
  },
  3: {
    kicker: "Checkpoint 03 · Logika Tambahan",
    title: "Multi Branch Conditionals",
    duration: "Video 3 · Cabang & Operator",
    videoId: "_jm2p3pstrM",
    bookmarks: [{"time": 0, "label": "Mengenal Elif"}, {"time": 14, "label": "Lebih dari Dua Pilihan?"}, {"time": 111, "label": "Multi-Branch Decision"}, {"time": 230, "label": "Contoh di Python"}, {"time": 422, "label": "Kenapa Urutan Penting?"}],
    quizzes: [
      {
        time: 594,
        shown: false,
        resume: false,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan 1: Lengkapi Kode! 🧩</h2>
              <div class="slide-text">
              <p>Instruksi: Program mengecek kategori usia. Jika usia 18 tahun ke atas dianggap "Dewasa", kalau di bawah 18 tahun masih "Biasa aja".</p>
              <p>Lengkapi bagian yang kosong dengan mengetik <strong>keyword percabangan</strong> dan <strong>kondisi pengecekannya</strong> secara manual!</p>
              <div class="code-block" style="font-size: 16px;">
<span class="keyword">age</span> <span class="operator">=</span> <span class="string">15</span><br><br>
<span class="keyword">if</span> age <span class="operator">&gt;=</span> <span class="string">18</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Dewasa")<br>
<input type="text" id="mb1-kw" placeholder="keyword" style="width: 90px; font-family: monospace; font-size: 16px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> <input type="text" id="mb1-cond" placeholder="kondisinya..." style="width: 150px; font-family: monospace; font-size: 16px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Biasa aja")
              </div>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button id="mb1-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Cek Kode Saya!</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          },
          {
            html: `
              <h2 class="slide-title">Latihan 2: Perbaiki Bug! 🐛</h2>
              <div class="slide-text">
              <p>Ada bug (kesalahan) di kode ini! Siswa dengan nilai 95 harusnya dapat "A", tapi dia malah dapat "B" karena urutannya salah.</p>
              <p>Ketik langsung angka yang benar pada kotak untuk memperbaiki urutan prioritas pengecekannya!</p>
              <div class="code-block" style="font-size: 16px;">
<span class="keyword">score</span> <span class="operator">=</span> <span class="string">95</span><br><br>
<span class="keyword">if</span> score <span class="operator">&gt;=</span> <input type="text" id="mb2-val1" placeholder="angka" style="width: 80px; font-family: monospace; font-size: 16px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("A")<br>
<span class="keyword">elif</span> score <span class="operator">&gt;=</span> <input type="text" id="mb2-val2" placeholder="angka" style="width: 80px; font-family: monospace; font-size: 16px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("B")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("C")
              </div>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
                  <button id="mb2-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Cek Kode Saya!</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          },
          {
            html: `
              <h2 class="slide-title">Latihan 3: Tebak Output 🕵️‍♂️</h2>
              <div class="slide-text">
              <p>Perhatikan baik-baik kode berikut:</p>
              <div class="code-block">
<span class="keyword">hari</span> <span class="operator">=</span> <span class="string">"Rabu"</span><br><br>
<span class="keyword">if</span> hari <span class="operator">==</span> <span class="string">"Sabtu"</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Bermain")<br>
<span class="keyword">elif</span> hari <span class="operator">==</span> <span class="string">"Minggu"</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Jalan-jalan")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Sekolah")
              </div>
              <p>Menurutmu apa yang akan dicetak di layar?</p>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button class="answer-opt-btn" data-correct="false" data-explanation="Salah! Hari yang dicek bukan Sabtu." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Bermain</button>
                  <button class="answer-opt-btn" data-correct="false" data-explanation="Salah! Hari yang dicek bukan Minggu." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Jalan-jalan</button>
                  <button class="answer-opt-btn" data-correct="true" data-explanation="Benar! Karena bukan Sabtu dan bukan Minggu, program akan menjalankan <code>else</code> dan mencetak Sekolah." style="background-color: #FFFFFF; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Sekolah</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      }
    ]
  },
  4: {
    kicker: "Checkpoint 04 · Bersarang",
    title: "Nested Conditionals",
    duration: "Video 4 · Kondisi dalam kondisi",
    videoId: "_e3hs1nWuME",
    bookmarks: [{"time": 0, "label": "Nested Conditionals"}, {"time": 133, "label": "Analogi Nested Condition"}, {"time": 267, "label": "Nested Condition di Python"}, {"time": 461, "label": "Contoh Kasus Game"}, {"time": 601, "label": "Masalah Nested Condition"}],
    quizzes: [
      {
        time: 649,
        shown: false,
        resume: true,
        resumeTime: 652,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan: Kurung Penyelamat! 🛡️</h2>
              <div class="slide-text">
              <p><strong>Skenario Game Online:</strong> Seorang pemain bisa login jika password-nya benar <strong>DAN</strong> (dia adalah admin <strong>ATAU</strong> pemain premium).</p>
              <ul>
                  <li><strong>Instruksi:</strong> Tuliskan logika yang tepat di dalam kotak. Jangan lupa gunakan <strong>tanda kurung</strong> agar pengecekan "admin atau premium" didahulukan!</li>
              </ul>
              <div class="code-block" style="font-size: 18px;">
<span class="keyword">password_ok</span> <span class="operator">=</span> <span class="keyword">True</span><br>
<span class="keyword">is_admin</span> <span class="operator">=</span> <span class="keyword">False</span><br>
<span class="keyword">is_premium</span> <span class="operator">=</span> <span class="keyword">True</span><br><br>
<span class="keyword">if</span> <input type="text" id="paren-input" placeholder="ketik kondisinya..." style="width: 450px; font-family: monospace; font-size: 18px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Welcome back, Player!")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Akses ditolak.")
              </div>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button id="paren-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Cek Kode Saya!</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      }
    ]
  },
  5: {
    kicker: "Checkpoint 05 · Logika Kombinasi",
    title: "Logical Operator",
    duration: "Video 5 · Menggabungkan kondisi",
    videoId: "_iRZY0-_skc",
    bookmarks: [{"time": 0, "label": "Penggabungan Kondisi"}, {"time": 108, "label": "Operator \"and\""}, {"time": 337, "label": "Operator \"or\""}, {"time": 541, "label": "Operator \"not\""}, {"time": 763, "label": "Menggabungkan 3+ Kondisi"}, {"time": 938, "label": "Prioritas Operator"}, {"time": 1028, "label": "Tanda Kurung ()"}],
    quizzes: [
      {
        time: 326,
        shown: false,
        resume: true,
        resumeTime: 330,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan: Logika <code>and</code> 🧩</h2>
              <div class="slide-text">
              <p><strong>Instruksi:</strong> Lengkapi program beasiswa berikut agar berjalan dengan benar!</p>
              <ul>
                  <li>Syarat Beasiswa: Nilai harus lebih dari 80 <strong>dan</strong> aktif organisasi bernilai True.</li>
                  <li>Ketik operator logika dan variabel kondisi yang tepat di dalam kotak.</li>
              </ul>
              <div class="code-block">
<span class="keyword">nilai</span> <span class="operator">=</span> <span class="string">85</span><br>
<span class="keyword">aktif_organisasi</span> <span class="operator">=</span> <span class="keyword">True</span><br><br>
<span class="keyword">if</span> nilai <span class="operator">&gt;</span> <span class="string">80</span> <input type="text" id="and-input" placeholder="ketik kondisinya..." style="width: 350px; font-family: monospace; font-size: 20px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Selamat, kamu dapat beasiswa!")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Belum memenuhi syarat.")
              </div>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button id="and-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Cek Kode Saya!</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      },
      {
        time: 535,
        shown: false,
        resume: true,
        resumeTime: 539,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan: Logika <code>or</code> 🧩</h2>
              <div class="slide-text">
              <p><strong>Instruksi:</strong> Lengkapi program diskon berikut!</p>
              <ul>
                  <li>Syarat Diskon: Pembeli adalah pelajar <strong>atau</strong> memiliki kupon diskon.</li>
                  <li>Ketik operator logika dan variabel kondisi yang tepat di dalam kotak.</li>
              </ul>
              <div class="code-block">
<span class="keyword">status</span> <span class="operator">=</span> <span class="string">"umum"</span><br>
<span class="keyword">ada_kupon</span> <span class="operator">=</span> <span class="keyword">True</span><br><br>
<span class="keyword">if</span> status <span class="operator">==</span> <span class="string">"pelajar"</span> <input type="text" id="or-input" placeholder="ketik kondisinya..." style="width: 250px; font-family: monospace; font-size: 20px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Hore! Kamu dapat diskon.")<br>
<span class="keyword">else</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Harga normal.")
              </div>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button id="or-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Cek Kode Saya!</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ],
      },
      {
        time: 1097,
        shown: false,
        resume: true,
        resumeTime: 1101,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan: Nested ke Logical 🛠️</h2>
              <div class="slide-text">
              <p>Ubah kode bercabang yang ribet ini menjadi satu baris kondisi dengan operator logika!</p>
              <div class="code-block" style="font-size: 16px; margin-bottom: 10px;">
<span style="color: #6c757d; font-style: italic;"># Kode Awal (Ribet):</span><br>
<span class="keyword">if</span> hari <span class="operator">==</span> <span class="string">"sabtu"</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="keyword">if</span> cuaca <span class="operator">==</span> <span class="string">"cerah"</span>:<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Main bola")
              </div>
              <div class="code-block" style="font-size: 16px;">
<span style="color: #6c757d; font-style: italic;"># Kode Barumu (Singkat):</span><br>
<span class="keyword">if</span> hari <span class="operator">==</span> <span class="string">"sabtu"</span> <input type="text" id="logical-input" placeholder="ketik kelanjutannya..." style="width: 250px; font-family: monospace; font-size: 16px; padding: 5px; border: 3px solid #1A1A1A; border-radius: 8px; color: #1A1A1A;"> :<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Main bola")
              </div>
              
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                  <button id="logical-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Cek Kode Saya!</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      }
    ]
  },
  6: {
    kicker: "Checkpoint 06 · Financial Literacy",
    title: "Needs vs Wants & Risks",
    duration: "Video 6 · Financial Literacy",
    videoId: "bMsKBaRsKmc",
    bookmarks: [{"time": 0, "label": "Financial Literacy"}, {"time": 133, "label": "Kebutuhan vs Keinginan"}, {"time": 151, "label": "Apa Itu Kebutuhan?"}, {"time": 182, "label": "Apa Itu Keinginan?"}, {"time": 402, "label": "Program Cek Kategori"}, {"time": 791, "label": "Budgeting"}, {"time": 1403, "label": "Risiko Finansial"}, {"time": 1659, "label": "Menilai Risiko"}],
    quizzes: [
      {
        time: 176,
        shown: false,
        resume: true,
        resumeTime: 176,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan 1: Kebutuhan Siswa 📚</h2>
              <div class="slide-text">
              <p>Apa contoh <strong>Kebutuhan</strong> kamu sebagai seorang siswa/i (selain yang disebutkan di video)?</p>
              <p>Tuliskan 5 contoh di bawah ini:</p>
              <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
                <input type="text" class="needs-input" placeholder="Kebutuhan 1..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="needs-input" placeholder="Kebutuhan 2..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="needs-input" placeholder="Kebutuhan 3..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="needs-input" placeholder="Kebutuhan 4..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="needs-input" placeholder="Kebutuhan 5..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
              </div>
              
              <div style="display: flex; justify-content: center; margin-top: 20px;">
                  <button id="needs-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Kumpulkan</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      },
      {
        time: 220,
        shown: false,
        resume: true,
        resumeTime: 220,
        questions: [
          {
            html: `
              <h2 class="slide-title">Latihan 2: Keinginan Siswa 🎮</h2>
              <div class="slide-text">
              <p>Nah, sekarang apa contoh <strong>Keinginan</strong> yang mau kamu beli yang masih berkaitan dengan sekolah?</p>
              <p>Tuliskan 5 contoh di bawah ini:</p>
              <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
                <input type="text" class="wants-input" placeholder="Keinginan 1..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="wants-input" placeholder="Keinginan 2..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="wants-input" placeholder="Keinginan 3..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="wants-input" placeholder="Keinginan 4..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
                <input type="text" class="wants-input" placeholder="Keinginan 5..." style="width: 80%; font-family: 'Fredoka', sans-serif; font-size: 16px; padding: 10px; border: 3px solid #1A1A1A; border-radius: 8px;">
              </div>
              
              <div style="display: flex; justify-content: center; margin-top: 20px;">
                  <button id="wants-check-btn" style="background-color: #FFE500; border: 4px solid #1A1A1A; border-radius: 16px; padding: 15px 30px; font-size: 20px; font-family: 'Fredoka', sans-serif; font-weight: bold; cursor: pointer; box-shadow: 6px 6px 0px #1A1A1A; transition: transform 0.1s;">Kumpulkan</button>
              </div>
              <div class="guess-feedback" style="display: none; padding: 15px; border-radius: 12px; border: 3px solid #1A1A1A; font-size: 20px; font-weight: bold; text-align: center; margin-top: 20px; line-height: 1.4;"></div>
              </div>`
          }
        ]
      },
      {
        time: 772,
        shown: false,
        resume: true,
        resumeTime: 785,
        questions: [
          {
            html: `
              <h2 class="slide-title">Mini Activity: Tentukan Kategori 🎯</h2>
              <div class="slide-text">
              <p>Pilih 3 barang dari tabel ini dan buat program Python untuk mengecek Kategorinya (Kebutuhan/Keinginan)!</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; margin-bottom: 15px;">
                  <thead>
                      <tr style="background-color: var(--blue); color: var(--white);">
                          <th style="padding: 5px; border: 2px solid var(--black);">Barang</th>
                          <th style="padding: 5px; border: 2px solid var(--black);">Kategori</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr><td style="padding: 5px; border: 1px solid var(--black);">Buku tulis</td><td style="padding: 5px; border: 1px solid var(--black);">Kebutuhan</td></tr>
                      <tr><td style="padding: 5px; border: 1px solid var(--black);">Air minum</td><td style="padding: 5px; border: 1px solid var(--black);">Kebutuhan</td></tr>
                      <tr><td style="padding: 5px; border: 1px solid var(--black);">Skin game</td><td style="padding: 5px; border: 1px solid var(--black);">Keinginan</td></tr>
                      <tr><td style="padding: 5px; border: 1px solid var(--black);">Snack tambahan</td><td style="padding: 5px; border: 1px solid var(--black);">Keinginan</td></tr>
                      <tr><td style="padding: 5px; border: 1px solid var(--black);">Pulsa internet kelas online</td><td style="padding: 5px; border: 1px solid var(--black);">Kebutuhan</td></tr>
                      <tr><td style="padding: 5px; border: 1px solid var(--black);">Gantungan kunci</td><td style="padding: 5px; border: 1px solid var(--black);">Keinginan</td></tr>
                  </tbody>
              </table>
              
              <textarea id="python-ide-6" spellcheck="false" placeholder="# Tulis programmu di sini" style="width: 100%; height: 180px; background-color: #1e1e1e; color: #d4d4d4; font-family: monospace; font-size: 14px; padding: 10px; border-radius: 8px; border: 1px solid #444; margin-bottom: 10px;"></textarea>
              
              <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;">
                  <button id="ide6-run-btn" style="background-color: var(--green); border: 2px solid #1A1A1A; border-radius: 8px; padding: 8px 16px; font-weight: bold; cursor: pointer; color: black;">Jalankan Kode</button>
                  <button id="ide6-submit-btn" style="background-color: #FFE500; border: 2px solid #1A1A1A; border-radius: 8px; padding: 8px 16px; font-weight: bold; cursor: pointer; color: black;">Kumpulkan</button>
              </div>
              
              <div id="ide-output-6" style="background-color: black; color: white; padding: 10px; border-radius: 8px; min-height: 50px; font-family: monospace; white-space: pre-wrap; font-size: 12px; margin-bottom: 10px;">Output program akan muncul di sini...</div>
              
              <div class="guess-feedback" style="display: none; padding: 10px; border-radius: 8px; border: 2px solid #1A1A1A; font-weight: bold; text-align: center;"></div>
              </div>`
          }
        ]
      },
      {
        time: 2123,
        shown: false,
        resume: false,
        resumeTime: 2127,
        questions: [
          {
            continueOnly: true,
            html: `
              <h2 class="slide-title">Selesai Menonton! 🎉</h2>
              <div class="slide-text">
              <p>Kamu sudah menyelesaikan Video 6!</p>
              <p>Mari kita ulas sebentar: Mengelola keuangan itu soal membuat keputusan. Kamu harus menimbang antara Kebutuhan dan Keinginan, serta Level Risiko dari setiap pengeluaran.</p>
              <p>Silakan lanjut ke Tab 7 untuk mengerjakan <strong>Tugas Akhir</strong> misi Conditional ini.</p>
              </div>
            `
          }
        ]
      }
    ]
  },
  7: {
    kicker: "Mandatory Assignment",
    title: "Smart Budget & Risk Planner",
    duration: "Tugas Akhir Misi Conditional",
    videoId: "bMsKBaRsKmc",
    startSeconds: 2137,
    quizzes: []
  }
};
