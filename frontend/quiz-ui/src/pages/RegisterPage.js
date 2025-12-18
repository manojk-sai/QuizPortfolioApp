import { useState } from "react";
import { register } from "../services/AuthApi";
import { setToken } from "../services/Token";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, CardContent, Typography, TextField, Button, Alert } from "@mui/material";

export default function RegisterPage() {
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
      const data = await register(email, password);
      setToken(data.accessToken);
      navigate("/");
    } catch (ex) {
      setErr(ex.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Register</Typography>

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
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>

          <Typography sx={{ mt: 2 }}>
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}