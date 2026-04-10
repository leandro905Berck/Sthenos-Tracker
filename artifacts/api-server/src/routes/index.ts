import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import exercisesRouter from "./exercises";
import mealsRouter from "./meals";
import dailyReportsRouter from "./daily-reports";
import weightChecksRouter from "./weight-checks";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(exercisesRouter);
router.use(mealsRouter);
router.use(dailyReportsRouter);
router.use(weightChecksRouter);
router.use(aiRouter);

export default router;
