import classes from "./LoadingMotion.module.css";

export default function LoadingMotion({ className }) {
  return (
    <div className={className}>
      <div className={classes.loader}></div>
    </div>
  );
}
