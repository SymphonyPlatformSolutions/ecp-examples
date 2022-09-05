import './Loading.scss';

export interface LoadingProps {
  className: string;
  animate: boolean;
}

export const Loading = (props: LoadingProps) => {
  return (
    <div className={`loading ${props.className}`}> 
      <svg viewBox="0 0 15 15" className={`${props.animate ? 'animate' : ''}`}>
        <polyline className="back" id="back" points="1 6 4 6 6 11 10 1 12 6 15 6"></polyline>
        <polyline className="front" id="front" points="1 6 4 6 6 11 10 1 12 6 15 6"></polyline>
      </svg>
    </div>
  )
}
