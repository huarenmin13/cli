package svglide

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

type StageReceipt struct {
	Stage     string   `json:"stage"`
	Status    string   `json:"status"`
	Message   string   `json:"message,omitempty"`
	Artifacts []string `json:"artifacts,omitempty"`
}

func CompleteCurrentStage(root string) (StatusReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return StatusReport{}, err
	}
	index, stage, err := currentStageWithIndex(run)
	if err != nil {
		return StatusReport{}, err
	}
	missingOutputs, err := missingRunPaths(safeRoot, stage.Outputs)
	if err != nil {
		return StatusReport{}, err
	}
	if len(missingOutputs) > 0 {
		return StatusReport{}, fmt.Errorf("current stage %q missing outputs: %s", stage.Name, strings.Join(missingOutputs, ", "))
	}

	if err := ValidateStageOutputs(root); err != nil {
		return StatusReport{}, err
	}

	if err := writeStageReceipt(safeRoot, StageReceipt{
		Stage:     stage.Name,
		Status:    StatusDone,
		Artifacts: stage.Outputs,
	}); err != nil {
		return StatusReport{}, err
	}

	run.Stages[index].Status = StatusDone
	if index < len(run.Stages)-1 {
		nextStage := &run.Stages[index+1]
		run.CurrentStage = nextStage.Name
		if nextStage.Status == "" {
			nextStage.Status = StatusPending
		}
	} else {
		run.CurrentStage = stage.Name
	}
	run.UpdatedAt = time.Now().Format(time.RFC3339)

	if err := writeRunFile(safeRoot, run); err != nil {
		return StatusReport{}, err
	}
	return InspectStatus(root)
}

func currentStageWithIndex(run Run) (int, Stage, error) {
	for i, stage := range run.Stages {
		if stage.Name == run.CurrentStage {
			return i, stage, nil
		}
	}
	return -1, Stage{}, fmt.Errorf("current stage %q not found in run", run.CurrentStage)
}

func writeRunFile(safeRoot string, run Run) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, "run.json")
	if err != nil {
		return err
	}
	return writeJSON(target, run)
}

func writeStageReceipt(safeRoot string, receipt StageReceipt) error {
	if strings.TrimSpace(receipt.Stage) == "" {
		return fmt.Errorf("stage receipt stage must not be empty")
	}
	if strings.ContainsAny(receipt.Stage, `/\`) || receipt.Stage == "." || receipt.Stage == ".." {
		return fmt.Errorf("stage receipt stage %q must be a file name", receipt.Stage)
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, filepath.Join("receipts", receipt.Stage+".json"))
	if err != nil {
		return err
	}
	return writeJSON(target, receipt)
}
