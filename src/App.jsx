import Project from "../project/dressly20260410/Index";
import ScaledContainer from "./component/container";
import  ElementProvider from "./context/ContextElement";



function App() {


return(
  <ElementProvider>


<ScaledContainer
       mode="client"
     //   mode="developer"
      >
        <Project />

  </ScaledContainer>

    </ElementProvider>

)
/*
  return (
    <ElementProvider>
      <ScaledContainer
        mode="client"
       // mode="developer"
      >
        <Project />
      </ScaledContainer>
    </ElementProvider>
  );
  */
}
export default App;

/*
left-top
top
right-top
right
right-bottom
bottom
left-bottom
left
middle
*/
