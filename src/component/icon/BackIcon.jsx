const BackIcon = ({ width = 48, height = 48, fill = 'white', ...props }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M20 10L8 22L20 34V27H29C35 27 40 31 42 36C42 23 36 18 28 18H20V10Z"
        fill={fill}
      />
    </svg>
  );
};

export default BackIcon;