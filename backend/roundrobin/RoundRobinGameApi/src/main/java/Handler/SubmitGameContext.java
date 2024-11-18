package Handler;

public class SubmitGameContext {


    public void submitGame(CalculateResultStrategy strategy) throws RoundRobinException {
        strategy.calculateGameResult();
    }

}
