import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./ReceiptPage.module.css";
import LeftCol from "../features/LeftCol.jsx";
import RightCol from "../features/RightCol.jsx";
import { getReceiptById } from "../services/api";
import link from "../assets/link.svg";
function SimpleCopyUrlButton() {
  const copyUrl = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert("URL copied to clipboard!"))
      .catch((err) => alert("Failed to copy URL"));
  };

  return (
    <div onClick={copyUrl} className={styles.linkButton}>
      <img src={link} alt="Copy link" className={styles.link} />
    </div>
  );
}
import cog from "../assets/cog.svg";

function ReceiptPage() {
  const { receiptId } = useParams();
  console.log("Rendering receipt page for ID:", receiptId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tips, setTips] = useState(0);
  const [amount, setAmount] = useState(0);
  const [participants, setParticipants] = useState([
    { id: 1, name: "Anna", amount: 0 },
    { id: 2, name: "Ivan", amount: 0 },
    { id: 3, name: "Maria", amount: 0 },
  ]);

  const [itemAssignments, setItemAssignments] = useState({});
  const [sberBonusAmount, setSberBonusAmount] = useState(0);
  const [originalTotalAmount, setOriginalTotalAmount] = useState(0);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const settingsDropdownRef = useRef(null);

  // Click outside handler for settings dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(event.target)
      ) {
        setShowSettingsDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  //www.claudeusercontent.com/?errorReportingMode=parent
  // Пересчет итоговой суммы при изменении бонусов СберСпасибо
  https: useEffect(() => {
    // Вычитаем бонусы из общей суммы, но не меньше 0
    const newTotal = Math.max(0, originalTotalAmount - sberBonusAmount);
    setTotalAmount(newTotal);
  }, [sberBonusAmount, originalTotalAmount]);

  // Verify the total sum calculation
  const verifyTotal = (data) => {
    if (!data || !data.items || !Array.isArray(data.items)) {
      console.warn("Cannot verify total: Invalid data format");
      return;
    }

    let calculatedTotal = 0;
    data.items.forEach((item) => {
      if (
        item.total_item_price != null &&
        typeof item.total_item_price === "number"
      ) {
        calculatedTotal += item.total_item_price;
      } else {
        console.warn(
          `Invalid price for item '${item.name}', skipping in total calculation`
        );
      }
    });

    calculatedTotal = parseFloat(calculatedTotal.toFixed(2));
    const grandTotal = data.grand_total
      ? parseFloat(data.grand_total.toFixed(2))
      : 0;

    console.log(`\n--- Receipt Total Verification ---`);
    console.log(`Calculated sum of all items: ${calculatedTotal.toFixed(2)} ₽`);
    console.log(`Grand total from receipt: ${grandTotal.toFixed(2)} ₽`);
    console.log(`Difference: ${(grandTotal - calculatedTotal).toFixed(2)} ₽`);
    console.log(`----------------------------------\n`);
  };

  // Fetch receipt data when component mounts or receiptId changes
  useEffect(() => {
    async function fetchReceiptData() {
      if (!receiptId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getReceiptById(receiptId);
        console.log("Received receipt data:", data);
        setReceiptData(data);

        // Format items for our component
        if (data.items && Array.isArray(data.items)) {
          const formattedItems = data.items.map((item, index) => ({
            id: index + 1,
            name: item.name,
            price: item.total_item_price,
            quantity: item.quantity || 1,
          }));
          setItems(formattedItems);
          setTotalAmount(data.grand_total || 0);
          setOriginalTotalAmount(data.grand_total || 0);
          setServiceFee(data.service_fee || 0);
          setDiscount(data.discount || 0);
          setTips(data.tips || 0);
          setAmount(data.amount || 0);
          // Verify and log the total calculation
          verifyTotal(data);
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError(err.message || "Failed to load receipt data");
      } finally {
        setLoading(false);
      }
    }

    fetchReceiptData();
  }, [receiptId]);

  const handleSelectPayer = (itemId, selectedPayerIds, amountPerPerson) => {
    const updatedParticipants = [...participants];

    const prevAssignment = itemAssignments[itemId] || {
      payerIds: [],
      amountPerPerson: 0,
    };

    if (prevAssignment.payerIds.length > 0) {
      prevAssignment.payerIds.forEach((payerId) => {
        const participant = updatedParticipants.find((p) => p.id === payerId);
        if (participant) {
          participant.amount -= prevAssignment.amountPerPerson;
        }
      });
    }

    selectedPayerIds.forEach((payerId) => {
      const participant = updatedParticipants.find((p) => p.id === payerId);
      if (participant) {
        participant.amount += amountPerPerson;
      }
    });

    setParticipants(updatedParticipants);

    setItemAssignments({
      ...itemAssignments,
      [itemId]: { payerIds: selectedPayerIds, amountPerPerson },
    });
  };

  const handleAddParticipant = (name) => {
    if (name && name.trim()) {
      const newParticipant = {
        id: Date.now(),
        name: name.trim(),
        amount: 0,
      };
      setParticipants([...participants, newParticipant]);
    }
  };

  // Split bill equally among all participants
  const handleSplitEqually = () => {
    if (participants.length === 0 || totalAmount === 0) return;

    const equalShare = totalAmount / participants.length;
    const formattedEqualShare = parseFloat(equalShare.toFixed(2));

    const updatedParticipants = participants.map((participant) => ({
      ...participant,
      amount: formattedEqualShare,
    }));

    setParticipants(updatedParticipants);

    // Reset item assignments as we're now splitting equally
    setItemAssignments({});
    setShowSettingsDropdown(false);
  };

  // Reset all distributions
  const handleResetDistribution = () => {
    const updatedParticipants = participants.map((participant) => ({
      ...participant,
      amount: 0,
    }));

    setParticipants(updatedParticipants);
    setItemAssignments({});
    setShowSettingsDropdown(false);
  };

  // Remove the last participant
  const handleRemoveLastParticipant = () => {
    if (participants.length <= 1) return;

    const newParticipants = [...participants];
    newParticipants.pop();

    // Update item assignments to remove the last participant
    const updatedAssignments = { ...itemAssignments };

    Object.keys(updatedAssignments).forEach((itemId) => {
      const assignment = updatedAssignments[itemId];
      const removedParticipantId = participants[participants.length - 1].id;

      if (assignment.payerIds.includes(removedParticipantId)) {
        const updatedPayerIds = assignment.payerIds.filter(
          (id) => id !== removedParticipantId
        );

        if (updatedPayerIds.length > 0) {
          // Recalculate amount per person
          const amountPerPerson =
            (assignment.amountPerPerson * assignment.payerIds.length) /
            updatedPayerIds.length;

          updatedAssignments[itemId] = {
            ...assignment,
            payerIds: updatedPayerIds,
            amountPerPerson,
          };
        } else {
          // If no payers left, remove the assignment
          delete updatedAssignments[itemId];
        }
      }
    });

    setItemAssignments(updatedAssignments);
    setParticipants(newParticipants);
    setShowSettingsDropdown(false);
  };

  if (loading) {
    return (
      <div className={styles.receiptContainer}>
        <div className={styles.loadingState}>Loading receipt data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.receiptContainer}>
        <div className={styles.errorState}>
          <h2>Error loading receipt</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.receiptContainer}>
      <div className={styles.receiptHeader}>
        <div>
          Чек #{receiptId} <SimpleCopyUrlButton />
        </div>

        <div className={styles.receiptTotal}>
          {/* Total amount removed from UI as requested */}
        </div>
      </div>

      <div className={styles.columnsContainer}>
        <div className={styles.participantsColumn}>
          <div className={styles.participantsHeader}>
            <h2 className={styles.participantsHeaderDiv}>Участники</h2>
            <div style={{ position: "relative" }} ref={settingsDropdownRef}>
              <img
                src={cog}
                alt="Настройки"
                className={styles.settings}
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              />
              {showSettingsDropdown && (
                <div className={styles.settingsDropdown}>
                  <div
                    className={styles.settingsOption}
                    onClick={handleSplitEqually}
                  >
                    Разделить поровну
                  </div>
                  <div
                    className={styles.settingsOption}
                    onClick={handleResetDistribution}
                  >
                    Сбросить распределение
                  </div>
                  <div
                    className={styles.settingsOption}
                    onClick={handleRemoveLastParticipant}
                  >
                    Убрать последнего участника
                  </div>
                </div>
              )}
            </div>
          </div>
          <LeftCol
            totalAmount={totalAmount}
            serviceFee={serviceFee}
            discount={discount}
            tips={tips}
            amount={amount}
            participants={participants}
            onAddParticipant={handleAddParticipant}
            available={1000}
            selectedBonus={sberBonusAmount}
            setSelectedBonus={setSberBonusAmount}
          />
        </div>

        <div className={styles.itemsColumn}>
          <h2>Позиции</h2>
          <RightCol
            items={items}
            participants={participants}
            onSelectPayer={handleSelectPayer}
          />
        </div>
      </div>
    </div>
  );
}

export default ReceiptPage;
