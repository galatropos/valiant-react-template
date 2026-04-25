const IconPlay = ({
  width = "100%",
  height = "100%",
  ariaLabel = "",
  hidden = true,
  focusable = false,
}) => {
  return (
    <svg
      aria-label={ariaLabel}
      aria-hidden={hidden}
      width={width}
      height={height}
      role="img"
      focusable={focusable}
      viewBox="8 5.98 9.68 12.04"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98a.998.998 0 0 0-1.54.84z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default IconPlay;