import { useState } from "react";
import { login } from "../services/AuthApi";
import { setToken } from "../services/Token";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, CardContent, Typography, TextField, Button, Alert } from "@mui/material";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await login(email, password);
      setToken(data.accessToken);
      navigate("/"); // go to homepage
    } catch (ex) {
      setErr(ex.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Login</Typography>

          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

          <form onSubmit={onSubmit}>
            <TextField
              label="Email"
              fullWidth
              sx={{ mb: 2 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              sx={{ mb: 2 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <Typography sx={{ mt: 2 }}>
            Don’t have an account? <Link to="/register">Register</Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}