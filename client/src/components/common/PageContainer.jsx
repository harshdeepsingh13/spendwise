import { Container } from "@mui/material";
import PropTypes from "prop-types";

/**
 * Reusable PageContainer component for consistent page layouts
 * @param {Object} props
 * @param {string} props.maxWidth - Container maxWidth ('sm', 'md', 'lg', etc.)
 * @param {Object} props.sx - Additional sx props to merge with defaults
 * @param {ReactNode} props.children - Page content
 */
export const PageContainer = ({ maxWidth = "lg", sx = {}, children, ...props }) => {
  return (
    <Container
      maxWidth={maxWidth}
      fixed={false}
      sx={{
        pb: 10, // Extra bottom padding for mobile FABs
        ...sx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

PageContainer.propTypes = {
  maxWidth: PropTypes.string,
  sx: PropTypes.object,
  children: PropTypes.node.isRequired,
};
