import PropTypes from "prop-types";
import { Container, Typography } from "@mui/material";

export default function ScorePage({ score }) {
  return (
    <Container maxWidth="sm" sx={{ mt: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Quiz Completed!
      </Typography>
      <Typography variant="h5" gutterBottom>
        Your Score: {score}
      </Typography>
    </Container>
  );
}

ScorePage.propTypes = {
  score: PropTypes.number.isRequired,
};