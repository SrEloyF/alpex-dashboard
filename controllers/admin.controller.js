const bcrypt = require('bcrypt');

exports.loginView = (req, res) => {
  if (req.session.admin) {
    return res.redirect('/');
  }
  res.render('admin/login', { error: null });
};

exports.login = async (req, res) => {
  const { correo, password } = req.body;

  if (correo !== process.env.ADMIN_EMAIL) {
    return res.render('admin/login', { error: 'Credenciales inválidas' });
  }

  const validPassword = await bcrypt.compare(
    password,
    process.env.ADMIN_PASSWORD_HASH
  );

  if (!validPassword) {
    return res.render('admin/login', { error: 'Credenciales inválidas' });
  }

  req.session.admin = true;

  res.redirect('/');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};