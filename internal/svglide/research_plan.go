package svglide

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"
)

type researchPlanArtifact struct {
	Entity struct {
		Name                 string `json:"name"`
		Type                 string `json:"type"`
		RequiresConfirmation bool   `json:"requires_confirmation"`
	} `json:"entity"`
	Identifiers []struct {
		ID           string `json:"id"`
		Type         string `json:"type"`
		Value        string `json:"value"`
		MarketHint   string `json:"market_hint"`
		ConfidenceBP int    `json:"confidence_bp"`
		Reason       string `json:"reason"`
	} `json:"identifiers"`
	EvidenceNeeds []struct {
		ID       string `json:"id"`
		Type     string `json:"type"`
		Required bool   `json:"required"`
	} `json:"evidence_needs"`
	SourceLadders []struct {
		IdentifierID               string   `json:"identifier_id"`
		EvidenceNeedID             string   `json:"evidence_need_id"`
		RequiredSourceClasses      []string `json:"required_source_classes"`
		FallbackSourceClasses      []string `json:"fallback_source_classes"`
		ForbiddenOnlySourceClasses []string `json:"forbidden_only_source_classes"`
	} `json:"source_ladders"`
	MinimumCoverage struct {
		MinRetrievedSources               int  `json:"min_retrieved_sources"`
		IdentitySourceRequired            bool `json:"identity_source_required"`
		AllRequiredSourceClassesAttempted bool `json:"all_required_source_classes_attempted"`
	} `json:"minimum_coverage"`
	FailurePolicy struct {
		BlockIfRequiredSourceClassMissing       bool `json:"block_if_required_source_class_missing"`
		BlockIfOnlyGeneralSearch                bool `json:"block_if_only_general_search"`
		ClarifyIfIdentityUnconfirmedAfterLadder bool `json:"clarify_if_identity_unconfirmed_after_ladder"`
	} `json:"failure_policy"`
}

type researchQueriesArtifact struct {
	Queries []researchQueryArtifact `json:"queries"`
}

type researchQueryArtifact struct {
	ID                 string   `json:"id"`
	PlanIdentifierID   string   `json:"plan_identifier_id"`
	SourceClass        string   `json:"source_class"`
	Method             string   `json:"method"`
	QueryOrURL         string   `json:"query_or_url"`
	Purpose            string   `json:"purpose"`
	Status             string   `json:"status"`
	RetrievedSourceIDs []string `json:"retrieved_source_ids"`
}

func ValidateResearchPlanGate(safeRoot string) error {
	requestType, requestName, err := readResolvedRequestEntity(safeRoot)
	if err != nil {
		return err
	}
	requestResolution, err := readEntityResolutionArtifact(safeRoot)
	if err != nil {
		return err
	}
	plan, err := readResearchPlanArtifact(safeRoot)
	if err != nil {
		return err
	}
	queries, err := readResearchQueriesArtifact(safeRoot)
	if err != nil {
		return err
	}
	sources, err := readSourcesArtifactForResearchPlan(safeRoot)
	if err != nil {
		return err
	}
	if err := validateResearchPlanMatchesRequest(plan, requestType, requestName); err != nil {
		return err
	}
	if err := validateRequestIdentifiersPlanned(requestResolution, plan); err != nil {
		return err
	}
	identifierByID, needByID, err := validateResearchPlanReferences(plan)
	if err != nil {
		return err
	}
	queryByID, attemptedClassesByIdentifier, retrievedClassesByIdentifier, err := validateResearchQueries(plan, queries, identifierByID)
	if err != nil {
		return err
	}
	if err := validateResearchSourcesLinkQueries(sources, queryByID, retrievedClassesByIdentifier); err != nil {
		return err
	}
	if err := validateResearchSourceLadders(plan, identifierByID, needByID, attemptedClassesByIdentifier); err != nil {
		return err
	}
	if err := validateStrongIdentifierSourceLadders(plan, attemptedClassesByIdentifier); err != nil {
		return err
	}
	if err := validateResearchMinimumCoverage(plan, sources); err != nil {
		return err
	}
	return nil
}

func readEntityResolutionArtifact(safeRoot string) (entityResolutionArtifact, error) {
	raw, err := readRunRegularArtifact(safeRoot, "request/entity_resolution.json")
	if err != nil {
		return entityResolutionArtifact{}, fmt.Errorf("request/entity_resolution.json: read artifact: %w", err)
	}
	var resolution entityResolutionArtifact
	if err := json.Unmarshal(raw, &resolution); err != nil {
		return entityResolutionArtifact{}, fmt.Errorf("request/entity_resolution.json: invalid JSON: %w", err)
	}
	return resolution, nil
}

func readResearchPlanArtifact(safeRoot string) (researchPlanArtifact, error) {
	raw, err := readRunRegularArtifact(safeRoot, "research/research_plan.json")
	if err != nil {
		return researchPlanArtifact{}, fmt.Errorf("research/research_plan.json: read artifact: %w", err)
	}
	var plan researchPlanArtifact
	if err := json.Unmarshal(raw, &plan); err != nil {
		return researchPlanArtifact{}, fmt.Errorf("research/research_plan.json: invalid JSON: %w", err)
	}
	return plan, nil
}

func readResearchQueriesArtifact(safeRoot string) (researchQueriesArtifact, error) {
	raw, err := readRunRegularArtifact(safeRoot, "research/queries.json")
	if err != nil {
		return researchQueriesArtifact{}, fmt.Errorf("research/queries.json: read artifact: %w", err)
	}
	var queries researchQueriesArtifact
	if err := json.Unmarshal(raw, &queries); err != nil {
		return researchQueriesArtifact{}, fmt.Errorf("research/queries.json: invalid JSON: %w", err)
	}
	return queries, nil
}

func readSourcesArtifactForResearchPlan(safeRoot string) (sourcesArtifactForGate, error) {
	raw, err := readRunRegularArtifact(safeRoot, "research/sources.json")
	if err != nil {
		return sourcesArtifactForGate{}, fmt.Errorf("research/sources.json: read artifact: %w", err)
	}
	var sources sourcesArtifactForGate
	if err := json.Unmarshal(raw, &sources); err != nil {
		return sourcesArtifactForGate{}, fmt.Errorf("research/sources.json: invalid JSON: %w", err)
	}
	return sources, nil
}

func validateResearchPlanMatchesRequest(plan researchPlanArtifact, requestType, requestName string) error {
	if strings.TrimSpace(plan.Entity.Type) != requestType {
		return fmt.Errorf("research_plan_gate: entity type %q does not match request/entity_resolution.json type %q", strings.TrimSpace(plan.Entity.Type), requestType)
	}
	if requestName != "" && strings.TrimSpace(plan.Entity.Name) != requestName {
		return fmt.Errorf("research_plan_gate: entity name %q does not match request/entity_resolution.json name %q", strings.TrimSpace(plan.Entity.Name), requestName)
	}
	return nil
}

func validateRequestIdentifiersPlanned(resolution entityResolutionArtifact, plan researchPlanArtifact) error {
	planned := map[string]bool{}
	for _, identifier := range plan.Identifiers {
		planned[identifierKey(identifier.Type, identifier.Value)] = true
	}
	for _, identifier := range resolution.Identifiers {
		if !isStrongResearchIdentifierType(identifier.Type) {
			continue
		}
		if !planned[identifierKey(identifier.Type, identifier.Value)] {
			return fmt.Errorf("research_plan_gate: request identifier %s=%q missing from research_plan identifiers", strings.TrimSpace(identifier.Type), strings.TrimSpace(identifier.Value))
		}
	}
	return nil
}

func validateResearchPlanReferences(plan researchPlanArtifact) (map[string]string, map[string]string, error) {
	identifierByID := map[string]string{}
	for _, identifier := range plan.Identifiers {
		id := strings.TrimSpace(identifier.ID)
		if id == "" {
			return nil, nil, fmt.Errorf("research_plan_gate: identifier id is required")
		}
		if _, exists := identifierByID[id]; exists {
			return nil, nil, fmt.Errorf("research_plan_gate: duplicate identifier id %q", id)
		}
		identifierType := strings.TrimSpace(identifier.Type)
		if identifierType == "" {
			return nil, nil, fmt.Errorf("research_plan_gate: identifier %q type is required", id)
		}
		if strings.TrimSpace(identifier.Value) == "" {
			return nil, nil, fmt.Errorf("research_plan_gate: identifier %q value is required", id)
		}
		identifierByID[id] = identifierType
	}
	needByID := map[string]string{}
	for _, need := range plan.EvidenceNeeds {
		id := strings.TrimSpace(need.ID)
		if id == "" {
			return nil, nil, fmt.Errorf("research_plan_gate: evidence_need id is required")
		}
		if _, exists := needByID[id]; exists {
			return nil, nil, fmt.Errorf("research_plan_gate: duplicate evidence_need id %q", id)
		}
		needByID[id] = strings.TrimSpace(need.Type)
	}
	return identifierByID, needByID, nil
}

func validateResearchQueries(plan researchPlanArtifact, queries researchQueriesArtifact, identifierByID map[string]string) (map[string]researchQueryArtifact, map[string]map[string]bool, map[string]map[string]bool, error) {
	queryByID := map[string]researchQueryArtifact{}
	attemptedClassesByIdentifier := map[string]map[string]bool{}
	retrievedClassesByIdentifier := map[string]map[string]bool{}
	for _, query := range queries.Queries {
		id := strings.TrimSpace(query.ID)
		if id == "" {
			return nil, nil, nil, fmt.Errorf("research_plan_gate: query id is required")
		}
		if _, exists := queryByID[id]; exists {
			return nil, nil, nil, fmt.Errorf("research_plan_gate: duplicate query id %q", id)
		}
		identifierID := strings.TrimSpace(query.PlanIdentifierID)
		if _, ok := identifierByID[identifierID]; !ok {
			return nil, nil, nil, fmt.Errorf("research_plan_gate: query %q references unknown plan_identifier_id %q", id, identifierID)
		}
		sourceClass := strings.TrimSpace(query.SourceClass)
		if sourceClass == "" {
			return nil, nil, nil, fmt.Errorf("research_plan_gate: query %q source_class is required", id)
		}
		if strings.TrimSpace(query.QueryOrURL) == "" {
			return nil, nil, nil, fmt.Errorf("research_plan_gate: query %q query_or_url is required", id)
		}
		if queryStatusAttempted(query.Status) {
			addClass(attemptedClassesByIdentifier, identifierID, sourceClass)
		}
		if strings.TrimSpace(query.Status) == "retrieved" {
			addClass(retrievedClassesByIdentifier, identifierID, sourceClass)
		}
		queryByID[id] = query
	}
	for _, ladder := range plan.SourceLadders {
		if _, ok := attemptedClassesByIdentifier[strings.TrimSpace(ladder.IdentifierID)]; !ok {
			attemptedClassesByIdentifier[strings.TrimSpace(ladder.IdentifierID)] = map[string]bool{}
		}
	}
	return queryByID, attemptedClassesByIdentifier, retrievedClassesByIdentifier, nil
}

func validateResearchSourcesLinkQueries(sources sourcesArtifactForGate, queryByID map[string]researchQueryArtifact, retrievedClassesByIdentifier map[string]map[string]bool) error {
	for _, source := range sources.Sources {
		id := strings.TrimSpace(source.ID)
		queryID := strings.TrimSpace(source.QueryID)
		query, ok := queryByID[queryID]
		if !ok {
			return fmt.Errorf("research_plan_gate: source %q references unknown query_id %q", id, queryID)
		}
		if !slices.Contains(query.RetrievedSourceIDs, id) {
			return fmt.Errorf("research_plan_gate: source %q not listed in query %q retrieved_source_ids", id, queryID)
		}
		sourceClass := strings.TrimSpace(source.SourceClass)
		if sourceClass != strings.TrimSpace(query.SourceClass) {
			return fmt.Errorf("research_plan_gate: source %q source_class %q does not match query %q source_class %q", id, sourceClass, queryID, strings.TrimSpace(query.SourceClass))
		}
		addClass(retrievedClassesByIdentifier, strings.TrimSpace(query.PlanIdentifierID), sourceClass)
	}
	return nil
}

func validateResearchSourceLadders(plan researchPlanArtifact, identifierByID map[string]string, needByID map[string]string, attemptedClassesByIdentifier map[string]map[string]bool) error {
	for _, ladder := range plan.SourceLadders {
		identifierID := strings.TrimSpace(ladder.IdentifierID)
		if _, ok := identifierByID[identifierID]; !ok {
			return fmt.Errorf("research_plan_gate: source_ladder references unknown identifier_id %q", identifierID)
		}
		needID := strings.TrimSpace(ladder.EvidenceNeedID)
		if _, ok := needByID[needID]; !ok {
			return fmt.Errorf("research_plan_gate: source_ladder references unknown evidence_need_id %q", needID)
		}
		if len(ladder.RequiredSourceClasses) == 0 {
			return fmt.Errorf("research_plan_gate: source_ladder for identifier %q has no required_source_classes", identifierID)
		}
		if plan.MinimumCoverage.AllRequiredSourceClassesAttempted || plan.FailurePolicy.BlockIfRequiredSourceClassMissing {
			for _, sourceClass := range ladder.RequiredSourceClasses {
				sourceClass = strings.TrimSpace(sourceClass)
				if sourceClass == "" {
					return fmt.Errorf("research_plan_gate: source_ladder for identifier %q has empty required_source_class", identifierID)
				}
				if !attemptedClassesByIdentifier[identifierID][sourceClass] {
					return fmt.Errorf("research_plan_gate: identifier %q missing attempted source class %q", identifierID, sourceClass)
				}
			}
		}
	}
	return nil
}

func validateStrongIdentifierSourceLadders(plan researchPlanArtifact, attemptedClassesByIdentifier map[string]map[string]bool) error {
	requiredByIdentifier := map[string]map[string]bool{}
	for _, ladder := range plan.SourceLadders {
		identifierID := strings.TrimSpace(ladder.IdentifierID)
		if _, ok := requiredByIdentifier[identifierID]; !ok {
			requiredByIdentifier[identifierID] = map[string]bool{}
		}
		for _, sourceClass := range ladder.RequiredSourceClasses {
			requiredByIdentifier[identifierID][strings.TrimSpace(sourceClass)] = true
		}
	}
	for _, identifier := range plan.Identifiers {
		identifierID := strings.TrimSpace(identifier.ID)
		switch strings.TrimSpace(identifier.Type) {
		case "ticker":
			for _, sourceClass := range []string{"finance_quote", "issuer_site", "exchange_or_regulator"} {
				if !requiredByIdentifier[identifierID][sourceClass] {
					return fmt.Errorf("research_plan_gate: ticker identifier %q must require source class %q", strings.TrimSpace(identifier.Value), sourceClass)
				}
				if !attemptedClassesByIdentifier[identifierID][sourceClass] {
					return fmt.Errorf("research_plan_gate: ticker identifier %q missing attempted source class %q", strings.TrimSpace(identifier.Value), sourceClass)
				}
			}
		case "official_url":
			if !requiredByIdentifier[identifierID]["official_site"] {
				return fmt.Errorf("research_plan_gate: official_url identifier %q must require official_site", strings.TrimSpace(identifier.Value))
			}
			if !attemptedClassesByIdentifier[identifierID]["official_site"] {
				return fmt.Errorf("research_plan_gate: official_url identifier %q must attempt official_site first", strings.TrimSpace(identifier.Value))
			}
		}
	}
	return nil
}

func validateResearchMinimumCoverage(plan researchPlanArtifact, sources sourcesArtifactForGate) error {
	retrievedSourceCount := 0
	identitySourcePresent := false
	retrievedSourceClasses := map[string]bool{}
	for _, source := range sources.Sources {
		if retrievedSource(source.Retrieval) {
			retrievedSourceCount++
			retrievedSourceClasses[strings.TrimSpace(source.SourceClass)] = true
			if strings.TrimSpace(source.Usage) == "identity" {
				identitySourcePresent = true
			}
		}
	}
	if retrievedSourceCount < plan.MinimumCoverage.MinRetrievedSources {
		return fmt.Errorf("research_plan_gate: retrieved source count = %d, want >= %d", retrievedSourceCount, plan.MinimumCoverage.MinRetrievedSources)
	}
	if plan.MinimumCoverage.IdentitySourceRequired && !identitySourcePresent {
		return fmt.Errorf("research_plan_gate: identity source is required")
	}
	if plan.FailurePolicy.BlockIfOnlyGeneralSearch && len(retrievedSourceClasses) == 1 && retrievedSourceClasses["general_web_search"] {
		return fmt.Errorf("research_plan_gate: general_web_search cannot be the only source class")
	}
	return nil
}

func queryStatusAttempted(status string) bool {
	switch strings.TrimSpace(status) {
	case "retrieved", "failed", "unavailable":
		return true
	default:
		return false
	}
}

func retrievedSource(retrieval string) bool {
	switch strings.TrimSpace(retrieval) {
	case "full_page", "local_file", "user_provided":
		return true
	default:
		return false
	}
}

func addClass(byIdentifier map[string]map[string]bool, identifierID string, sourceClass string) {
	identifierID = strings.TrimSpace(identifierID)
	sourceClass = strings.TrimSpace(sourceClass)
	if identifierID == "" || sourceClass == "" {
		return
	}
	if _, ok := byIdentifier[identifierID]; !ok {
		byIdentifier[identifierID] = map[string]bool{}
	}
	byIdentifier[identifierID][sourceClass] = true
}

func isStrongResearchIdentifierType(identifierType string) bool {
	switch strings.TrimSpace(identifierType) {
	case "ticker", "official_url", "product_model", "paper_doi", "law_code":
		return true
	default:
		return false
	}
}

func identifierKey(identifierType, value string) string {
	return strings.TrimSpace(identifierType) + "\x00" + strings.TrimSpace(value)
}
